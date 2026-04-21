# Build phase
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependencies and Prisma schema
COPY package*.json ./
COPY tsconfig*.json ./ 
COPY nest-cli.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .
RUN npx prisma generate
RUN npm run build

# Production phase
FROM node:22-alpine

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Add healthcheck for database readiness
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD node -e "require('net').createConnection({port:5432,host:'postgres'},()=>process.exit(0)).on('error',()=>process.exit(1))"

# Start the application after applying Prisma migrations
EXPOSE 3000
CMD ["sh", "-c", "npx --no-install prisma migrate deploy && node dist/main.js"]