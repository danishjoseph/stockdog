{ pkgs, ... }: {
packages =  [
    pkgs.yarn
    pkgs.nodejs_18
    pkgs.docker-compose
    pkgs.bash-completion
    pkgs.git
  ];

env = {
    DB_HOST="";
    DB_PORT="";
    DB_USERNAME="";
    DB_PASSWORD="";
    DB_NAME="";
    SYNCHRONIZE=true;
  };

services.docker.enable = true;


}
