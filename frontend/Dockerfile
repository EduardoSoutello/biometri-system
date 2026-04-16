FROM node:20-alpine AS build

WORKDIR /app

# Copy package data and install dependencies
COPY package*.json ./
RUN npm install

# Build the frontend application
COPY . .
RUN npm run build

# Stage 2: Serve the production build using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
