# Use Node.js 20 LTS
FROM node:20.19

WORKDIR /usr/src/app

# Copy package.json and lock files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy rest of the source code
COPY . .

# Build the Vite app
RUN npm run build

# Install serve
RUN npm install -g serve

# Azure will set PORT dynamically
EXPOSE 8080

CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:8080"]

