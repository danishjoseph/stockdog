{ pkgs, ... }: {
packages =  [
    pkgs.yarn
    pkgs.nodejs_18
    pkgs.docker-compose
    pkgs.bash-completion
    pkgs.git
  ];

services.docker.enable = true;

}
