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



## Mogodb backup

Windows:

```powershell
mongodump -h localhost -d testdb

mongorestore -h localhost -d testdb dump\testdb
```

