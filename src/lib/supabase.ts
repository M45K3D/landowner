import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export default pool;
```

Save it, then run:
```
cd C:\Users\Param\Desktop\landowner
git add .
git commit -m "fix supabase.ts"
git push