<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
#   N e s t J s - T y p e O R M 
 
 


### Deploy docker :

* Step 1 : Prepare variables and create droplets server in the digital-ocean , install docker and add key to server , add secret to github actions

 - access to the https://hub.docker.com/ , and find the username to create DOCKER_USERNAME in the github actions 
    - in the taskmanager , click personal access token ---> generate new token ---> create token (CRUD) and copy its ,  then create DOCKER_PASSWORD in the github actions - value is token 

 - create-droplets in digital-ocean , choose ubuntu - create password and hostname  
 - digital-ocean -> droplets -> choose and copy IPv4 
 - open powershell , test connection : ssh root@<IPv4> if success -> terminal display : root@hostname:~#

 - create docker and docker compose for server : - after connect success : 
                                                 - sudo apt update
                                                 - sudo apt install docker.io docker-compose -y
                                                 - sudo systemctl start docker 
                                                 - sudo systemctl enable docker
                                                 - docker --version (if result : Docker version 20.10.7, build f0df350 its success)

- add Secrets and variables to git hub actions : Settings > Secrets and variables > Actions > New repository secret.
    - add : Name: SERVER_IP, Value: IPv4.
            Name: SERVER_USERNAME, Value: root.

- create SSH-PRIVATE-KEY : x 4096 -C "your-email@example.com"  
  - cat ~/.ssh/id_rsa ---> copy all (include -----BEGIN RSA PRIVATE KEY----- and -----END RSA PRIVATE KEY-----).
  - then copy and create SSH-PRIVATE-KEY in git hub actions

- create public key : - cat ~/.ssh/id_rsa.pub 
  - then copy all 
    - ---> mkdir -p ~/.ssh ---> echo "your-public-key" >> ~/.ssh/authorized_keys
      - paste to terminal the public key in ""

* Step 2 : Prepare file to deploy .

 - Dockerfile 
 - Docker-compose.yml : 
    - define 3 or more service :
      - NestJs(app) : 
        - DATABASE_URL: Chuỗi kết nối đến PostgreSQL. Ở đây là postgresql://postgres:password@postgres:5432/nestjs_db.
        - MINIO_ENDPOINT: Địa chỉ của MinIO, dùng http://minio:9000 vì MinIO chạy trong cùng mạng Docker.
        - MINIO_ACCESS_KEY: Khóa truy cập MinIO, mặc định là minioadmin.
        - MINIO_SECRET_KEY: Mật khẩu MinIO, mặc định là minioadmin.
        - MINIO_BUCKET: Tên bucket trong MinIO, đặt là my-bucket.
      - PostgresSQL(DB) :
        - POSTGRES_USER: Tên người dùng PostgreSQL, đặt là postgres.
        - POSTGRES_PASSWORD: Mật khẩu PostgreSQL, đặt là password.
        - POSTGRES_DB: Tên database, đặt là nestjs_db. 
      - MinIO (S3) :
        - MINIO_ROOT_USER: Tên người dùng MinIO, đặt là minioadmin.
        - MINIO_ROOT_PASSWORD: Mật khẩu MinIO, đặt là minioadmin. 
      - fix file .env và compose để nó đồng bộ với nhau
 - .github\workflows\deploy.yml : deploy cicd  -  các biến cần thiết đã được cài trong github actions

 * Step 3 : push files in step 2 to github , and deploy handmade first time: 
  - ssh root@159.223.76.76
  - git clone https://github.com/Bduyy2703/NestJs-TypeORM.git
    cd NestJs-TypeORM
  - docker-compose up -d --build
    --> access the http://ipV4 to check api NestJs 
    --> access the http://ipV4:9001 to check the minio 

# chú ý các phiên bản node(18-20 ...) , các thư viện node_modules --> có lỗi production thì sửa onmit-dev
------ check đang chạy : docker-compose ps
------ check log: docker-compose logs app(S3 / DB ...)
------ tắt đi chạy lại : docker-compose down (không mất dữ liệu)  , docker-compose down -v (mất dữ liệu ) ----->   docker-compose up -d --build
------ truy cập container trên docker để thao tác : docker-compose exec app bash --->        npm i - g      ---> npm run migration:run:prod  để chạy migrations -----> npm run seeding:run:prod chạy seed


#### deploy gg cloud : 
 # 
  - truy cập docker-compose exec app bash để cài các cái node và npm cần thiết , chạy các lệnh npm cần thiết 
  - ssh -i C:\Users\ASUS\.ssh\google_compute_engine ASUS@35.247.185.8   ---> access terminal of gg compute engine
https://github.com/Bduyy2703/NestJs-TypeORM
ssh -i C:\Users\ASUS\.ssh\gcp_jewelry nguyenduy7003@34.142.239.153    
34.142.239.153

docker cp ~/NestJs-TypeORM/minio/certs/public.crt nestjs-typeorm_app_1:/usr/local/share/ca-certificates/minio.crt
docker exec -it nestjs-typeorm_app_1 update-ca-certificates
docker exec -it nestjs-typeorm_app_1 sh -c "curl -v https://minio:9000"
docker exec -it nestjs-typeorm_app_1 ls -l /usr/local/share/ca-certificates/

nano ~/NestJs-TypeORM/nginx.conf
sudo lsof -i :443 
sudo systemctl stop nginx

