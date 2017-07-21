FROM lukechannings/ubuntu-precise

RUN apt-get install -y ffmpeg

WORKDIR /srv/http

COPY package.json .
RUN npm config set ca ''
RUN npm i

COPY *.js *.json ./

EXPOSE 6232

CMD node app.js
