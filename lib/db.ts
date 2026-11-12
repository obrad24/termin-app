import { neon, NeonQueryFunction } from '@neondatabase/serverless'

const databaseUrl = process.env.DATABASE_URL || ''

export const isDatabaseConfigured = () => {
  return !!(
    databaseUrl &&
    databaseUrl.startsWith('postgres') &&
    databaseUrl.length > 20
  )
}

let sql: NeonQueryFunction<false, false> | null = null

export function getSql() {
  if (!isDatabaseConfigured()) {
    throw new Error('DATABASE_URL is not configured')
  }
  if (!sql) {
    sql = neon(databaseUrl)
  }
  return sql
}

export type DbError = {
  message: string
  code?: string
  details?: string
  hint?: string
}

export type DbResult<T> = {
  data: T | null
  error: DbError | null
  count?: number | null
}

function toError(error: unknown): DbError {
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String((error as any).message || 'Database error'),
      code: (error as any).code,
      details: (error as any).detail || (error as any).details,
      hint: (error as any).hint,
    }
  }
  return { message: String(error || 'Database error') }
}

async function runQuery(db: NeonQueryFunction<false, false>, query: string, values: any[] = []) {
  const result = await db.query(query, values)
  if (Array.isArray(result)) return result as any[]
  if (result && typeof result === 'object' && Array.isArray((result as any).rows)) {
    return (result as any).rows as any[]
  }
  return []
}

function quoteIdent(name: string) {
  return `"${name.replace(/"/g, '""')}"`
}

type Filter =
  | { type: 'eq'; column: string; value: any }
  | { type: 'neq'; column: string; value: any }
  | { type: 'in'; column: string; values: any[] }
  | { type: 'is'; column: string; value: null }
  | { type: 'not_is'; column: string; value: null }
  | { type: 'or'; expression: string }

type Order = { column: string; ascending: boolean }

type NestedSelect = {
  alias: string
  columns: string[]
}

function parseSelect(select: string): { columns: string[]; nested: NestedSelect | null } {
  const nestedMatch = select.match(/([a-zA-Z_][\w]*)\s*\(([^)]*)\)/)
  if (!nestedMatch) {
    return {
      columns: select
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      nested: null,
    }
  }

  const alias = nestedMatch[1]
  const nestedCols = nestedMatch[2]
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)

  // Keep top-level parts that are not the nested relation block
  const withoutNested = select.replace(nestedMatch[0], '').replace(/,+/g, ',')
  const columns = withoutNested
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)

  if (!columns.includes('*') && columns.length === 0) {
    columns.push('*')
  }

  return {
    columns,
    nested: { alias, columns: nestedCols.length ? nestedCols : ['*'] },
  }
}

function buildWhere(filters: Filter[], startIndex = 1): { clause: string; values: any[]; nextIndex: number } {
  const parts: string[] = []
  const values: any[] = []
  let idx = startIndex

  for (const filter of filters) {
    if (filter.type === 'eq') {
      parts.push(`${quoteIdent(filter.column)} = $${idx++}`)
      values.push(filter.value)
    } else if (filter.type === 'neq') {
      parts.push(`${quoteIdent(filter.column)} <> $${idx++}`)
      values.push(filter.value)
    } else if (filter.type === 'in') {
      if (!filter.values.length) {
        parts.push('FALSE')
      } else {
        const placeholders = filter.values.map(() => `$${idx++}`).join(', ')
        parts.push(`${quoteIdent(filter.column)} IN (${placeholders})`)
        values.push(...filter.values)
      }
    } else if (filter.type === 'is') {
      parts.push(`${quoteIdent(filter.column)} IS NULL`)
    } else if (filter.type === 'not_is') {
      parts.push(`${quoteIdent(filter.column)} IS NOT NULL`)
    } else if (filter.type === 'or') {
      // Minimal support for supabase .or(`home_team.eq.X,away_team.eq.X`)
      const orParts = filter.expression.split(',').map((p) => p.trim()).filter(Boolean)
      const mapped = orParts.map((part) => {
        const [left, op, ...rest] = part.split('.')
        const value = rest.join('.')
        if (op === 'eq') {
          values.push(value)
          return `${quoteIdent(left)} = $${idx++}`
        }
        return 'TRUE'
      })
      if (mapped.length) parts.push(`(${mapped.join(' OR ')})`)
    }
  }

  return {
    clause: parts.length ? `WHERE ${parts.join(' AND ')}` : '',
    values,
    nextIndex: idx,
  }
}

class QueryBuilder<T = any> {
  private table: string
  private action: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select'
  private selectRaw = '*'
  private filters: Filter[] = []
  private orders: Order[] = []
  private limitCount: number | null = null
  private offsetCount: number | null = null
  private insertRows: Record<string, any>[] = []
  private updateValues: Record<string, any> | null = null
  private upsertConflict: string | null = null
  private wantSingle = false
  private wantMaybeSingle = false
  private returning = false
  private countExact = false
  private headOnly = false

  constructor(table: string) {
    this.table = table
  }

  select(columns = '*', options?: { count?: 'exact'; head?: boolean }) {
    this.action = this.action === 'insert' || this.action === 'update' || this.action === 'upsert'
      ? this.action
      : 'select'
    this.selectRaw = columns
    this.returning = true
    this.countExact = options?.count === 'exact'
    this.headOnly = options?.head === true
    return this
  }

  insert(rows: Record<string, any> | Record<string, any>[]) {
    this.action = 'insert'
    this.insertRows = Array.isArray(rows) ? rows : [rows]
    return this
  }

  update(values: Record<string, any>) {
    this.action = 'update'
    this.updateValues = values
    return this
  }

  upsert(rows: Record<string, any> | Record<string, any>[], options?: { onConflict?: string }) {
    this.action = 'upsert'
    this.insertRows = Array.isArray(rows) ? rows : [rows]
    this.upsertConflict = options?.onConflict || null
    return this
  }

  delete() {
    this.action = 'delete'
    return this
  }

  eq(column: string, value: any) {
    this.filters.push({ type: 'eq', column, value })
    return this
  }

  neq(column: string, value: any) {
    this.filters.push({ type: 'neq', column, value })
    return this
  }

  in(column: string, values: any[]) {
    this.filters.push({ type: 'in', column, values })
    return this
  }

  is(column: string, value: null) {
    this.filters.push({ type: 'is', column, value })
    return this
  }

  not(column: string, operator: string, value: any) {
    if (operator === 'is' && value === null) {
      this.filters.push({ type: 'not_is', column, value: null })
    }
    return this
  }

  or(expression: string) {
    this.filters.push({ type: 'or', expression })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: options?.ascending !== false })
    return this
  }

  limit(count: number) {
    this.limitCount = count
    return this
  }

  /** Supabase-compatible inclusive range pagination. */
  range(from: number, to: number) {
    const start = Math.max(0, Math.floor(from))
    const end = Math.max(start, Math.floor(to))
    this.offsetCount = start
    this.limitCount = end - start + 1
    return this
  }

  single() {
    this.wantSingle = true
    this.limitCount = 1
    return this.execute() as Promise<DbResult<T>>
  }

  maybeSingle() {
    this.wantMaybeSingle = true
    this.limitCount = 1
    return this.execute() as Promise<DbResult<T | null>>
  }

  then<TResult1 = DbResult<T[]>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled as any, onrejected)
  }

  private async execute(): Promise<DbResult<any>> {
    try {
      const db = getSql()

      if (this.action === 'select') {
        return await this.executeSelect(db)
      }
      if (this.action === 'insert') {
        return await this.executeInsert(db)
      }
      if (this.action === 'upsert') {
        return await this.executeUpsert(db)
      }
      if (this.action === 'update') {
        return await this.executeUpdate(db)
      }
      if (this.action === 'delete') {
        return await this.executeDelete(db)
      }

      return { data: null, error: { message: 'Unsupported query action' } }
    } catch (error) {
      return { data: null, error: toError(error) }
    }
  }

  private async executeSelect(db: NeonQueryFunction<false, false>): Promise<DbResult<any>> {
    const { clause, values } = buildWhere(this.filters)

    let totalCount: number | null = null
    if (this.countExact || this.headOnly) {
      const countQuery = `SELECT COUNT(*)::int AS count FROM ${quoteIdent(this.table)} ${clause}`
      const countRows = await runQuery(db, countQuery, values)
      totalCount = Number(countRows[0]?.count) || 0
      if (this.headOnly) {
        return { data: null, error: null, count: totalCount }
      }
    }

    const { columns, nested } = parseSelect(this.selectRaw)
    const selectCols = columns.includes('*')
      ? `${quoteIdent(this.table)}.*`
      : columns.map((c) => `${quoteIdent(this.table)}.${quoteIdent(c)}`).join(', ')

    const orderSql = this.orders.length
      ? `ORDER BY ${this.orders
          .map((o) => `${quoteIdent(this.table)}.${quoteIdent(o.column)} ${o.ascending ? 'ASC' : 'DESC'}`)
          .join(', ')}`
      : ''
    const limitSql = this.limitCount != null ? `LIMIT ${this.limitCount}` : ''
    const offsetSql = this.offsetCount != null ? `OFFSET ${this.offsetCount}` : ''

    const query = `SELECT ${selectCols} FROM ${quoteIdent(this.table)} ${clause} ${orderSql} ${limitSql} ${offsetSql}`
    const rows = await runQuery(db, query, values)

    let data = rows

    if (nested) {
      const fkCandidates: Record<string, string> = {
        players: 'player_id',
        teams: 'team_id',
        results: 'result_id',
      }
      const fk = fkCandidates[nested.alias]
      if (fk) {
        const ids = [...new Set(rows.map((r) => r[fk]).filter((v) => v != null))]
        let related: any[] = []
        if (ids.length) {
          const relatedQuery = `SELECT * FROM ${quoteIdent(nested.alias)} WHERE id = ANY($1)`
          related = await runQuery(db, relatedQuery, [ids])
        }
        const byId = new Map(
          related.map((r) => [String(r.id), r] as const),
        )
        data = rows.map((row) => {
          const relatedRow = byId.get(String(row[fk])) || null
          if (!relatedRow) return { ...row, [nested.alias]: null }
          if (nested.columns.includes('*')) {
            return { ...row, [nested.alias]: relatedRow }
          }
          const picked: Record<string, any> = {}
          nested.columns.forEach((c) => {
            picked[c] = relatedRow[c]
          })
          return { ...row, [nested.alias]: picked }
        })
      }
    }

    if (this.wantSingle || this.wantMaybeSingle) {
      if (!data.length) {
        if (this.wantMaybeSingle) return { data: null, error: null, count: totalCount }
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' }, count: totalCount }
      }
      return { data: data[0], error: null, count: totalCount }
    }

    return { data, error: null, count: totalCount }
  }

  private async executeInsert(db: NeonQueryFunction<false, false>): Promise<DbResult<any>> {
    if (!this.insertRows.length) return { data: [], error: null }

    const keys = Object.keys(this.insertRows[0])
    const allValues: any[] = []
    const valueGroups: string[] = []
    let idx = 1

    for (const row of this.insertRows) {
      const placeholders = keys.map(() => `$${idx++}`)
      valueGroups.push(`(${placeholders.join(', ')})`)
      keys.forEach((k) => allValues.push(row[k]))
    }

    const returning = this.returning || this.wantSingle || this.wantMaybeSingle ? 'RETURNING *' : ''
    const query = `INSERT INTO ${quoteIdent(this.table)} (${keys.map(quoteIdent).join(', ')}) VALUES ${valueGroups.join(', ')} ${returning}`
    const rows = await runQuery(db, query, allValues)

    if (this.wantSingle || this.wantMaybeSingle) {
      return { data: rows[0] || null, error: null }
    }
    return { data: this.returning ? rows : null, error: null }
  }

  private async executeUpsert(db: NeonQueryFunction<false, false>): Promise<DbResult<any>> {
    if (!this.insertRows.length) return { data: [], error: null }

    const keys = Object.keys(this.insertRows[0])
    const allValues: any[] = []
    const valueGroups: string[] = []
    let idx = 1

    for (const row of this.insertRows) {
      const placeholders = keys.map(() => `$${idx++}`)
      valueGroups.push(`(${placeholders.join(', ')})`)
      keys.forEach((k) => allValues.push(row[k]))
    }

    const conflict = this.upsertConflict
      ? this.upsertConflict.split(',').map((c) => quoteIdent(c.trim())).join(', ')
      : quoteIdent('id')
    const updates = keys
      .filter((k) => !this.upsertConflict?.split(',').map((c) => c.trim()).includes(k))
      .map((k) => `${quoteIdent(k)} = EXCLUDED.${quoteIdent(k)}`)
      .join(', ')

    const returning = this.returning || this.wantSingle || this.wantMaybeSingle ? 'RETURNING *' : ''
    const query = `
      INSERT INTO ${quoteIdent(this.table)} (${keys.map(quoteIdent).join(', ')})
      VALUES ${valueGroups.join(', ')}
      ON CONFLICT (${conflict}) DO UPDATE SET ${updates || `${keys[0]} = EXCLUDED.${keys[0]}`}
      ${returning}
    `
    const rows = await runQuery(db, query, allValues)

    if (this.wantSingle || this.wantMaybeSingle) {
      return { data: rows[0] || null, error: null }
    }
    return { data: this.returning ? rows : null, error: null }
  }

  private async executeUpdate(db: NeonQueryFunction<false, false>): Promise<DbResult<any>> {
    if (!this.updateValues) return { data: null, error: { message: 'No update values' } }

    const keys = Object.keys(this.updateValues)
    const values: any[] = []
    let idx = 1
    const sets = keys.map((k) => {
      values.push(this.updateValues![k])
      return `${quoteIdent(k)} = $${idx++}`
    })

    const where = buildWhere(this.filters, idx)
    values.push(...where.values)

    const returning = this.returning || this.wantSingle || this.wantMaybeSingle ? 'RETURNING *' : ''
    const query = `UPDATE ${quoteIdent(this.table)} SET ${sets.join(', ')} ${where.clause} ${returning}`
    const rows = await runQuery(db, query, values)

    if (this.wantSingle || this.wantMaybeSingle) {
      if (!rows.length) {
        return { data: null, error: { message: 'Row not found', code: 'PGRST116' } }
      }
      return { data: rows[0], error: null }
    }
    return { data: this.returning ? rows : null, error: null }
  }

  private async executeDelete(db: NeonQueryFunction<false, false>): Promise<DbResult<any>> {
    const where = buildWhere(this.filters)
    const query = `DELETE FROM ${quoteIdent(this.table)} ${where.clause}`
    await runQuery(db, query, where.values)
    return { data: null, error: null }
  }
}

/** Shared across StorageBucket instances so getPublicUrl sees upload() results. */
const uploadedPublicUrls = new Map<string, string>()

class StorageBucket {
  constructor(private bucket: string) {}

  private blobEnabled() {
    return !!process.env.BLOB_READ_WRITE_TOKEN
  }

  private cacheKey(filePath: string) {
    return `${this.bucket}/${filePath}`.replace(/\/+/g, '/')
  }

  async upload(
    filePath: string,
    buffer: Buffer,
    options?: { contentType?: string; upsert?: boolean },
  ) {
    try {
      const objectKey = this.cacheKey(filePath)

      // Production (Vercel): local FS is read-only — use Vercel Blob
      if (this.blobEnabled()) {
        const { put } = await import('@vercel/blob')
        const blob = await put(objectKey, buffer, {
          access: 'public',
          contentType: options?.contentType,
          addRandomSuffix: false,
          allowOverwrite: options?.upsert === true,
        })
        uploadedPublicUrls.set(objectKey, blob.url)
        return {
          data: { path: filePath, url: blob.url },
          error: null as DbError | null,
        }
      }

      // Local development: write under public/uploads
      const fs = await import('fs/promises')
      const path = await import('path')
      const uploadsRoot = path.join(process.cwd(), 'public', 'uploads', this.bucket)
      const fullPath = path.join(uploadsRoot, filePath)
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      await fs.writeFile(fullPath, buffer)
      const publicUrl = `/uploads/${objectKey}`
      uploadedPublicUrls.set(objectKey, publicUrl)
      return {
        data: { path: filePath, url: publicUrl },
        error: null as DbError | null,
      }
    } catch (error) {
      console.error(`Storage upload failed for ${this.bucket}/${filePath}:`, error)
      return { data: null, error: toError(error) }
    }
  }

  getPublicUrl(filePath: string) {
    const objectKey = this.cacheKey(filePath)
    const cached = uploadedPublicUrls.get(objectKey)
    if (cached) {
      return { data: { publicUrl: cached } }
    }
    const publicUrl = `/uploads/${objectKey}`
    return { data: { publicUrl } }
  }
}

export const db = {
  from<T = any>(table: string) {
    return new QueryBuilder<T>(table)
  },
  storage: {
    from(bucket: string) {
      return new StorageBucket(bucket)
    },
  },
}

// Backwards-compatible aliases used across the app
export const supabase = db
export const isSupabaseConfigured = isDatabaseConfigured
