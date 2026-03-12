import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export default pool;
```

Save it, then in terminal:
```
cd C:\Users\Param\Desktop\landowner
git add .
git commit -m "remove supabase"
git push