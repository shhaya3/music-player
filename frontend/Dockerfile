# No build stage needed — plain HTML/CSS/JS has no compilation step
FROM nginx:alpine

# Copy all frontend files directly into Nginx's serve directory
COPY . /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80