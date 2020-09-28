# njs-static

The node.js static service.

## Select Config

```powershell
set NODE_ENV=development
set NODE_ENV=production
```



## Debug

Windows:

```powershell
SET DEBUG=njs-static:*
npm start
```



## Deploy

```bash
pm2 deploy ecosystem.config.js production --force
```



## Mogodb backup

Windows:

```powershell
mongodump -h localhost -d testdb

mongorestore -h localhost -d testdb dump\testdb
```

## Known issue

Don't use http access api.
