FROM node:20-slim

WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY src/ ./src/
COPY data/ ./data/

RUN node -e "const fs=require('fs');const p=require('path');const d=p.join(__dirname,'data');if(!fs.existsSync(d))fs.mkdirSync(d);const f=p.join(d,'memory.json');if(!fs.existsSync(f))fs.writeFileSync(f,JSON.stringify({players:{},events:[],places:[],lastUpdated:0},null,2))"

CMD ["node", "src/index.js"]
