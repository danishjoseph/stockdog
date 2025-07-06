local g = import '../g.libsonnet';

local postgresDatasource = 'grafana-postgresql-datasource';
local postgresUid = 'edjh8vws68hdse';


{
  postgres: { datasource: postgresDatasource, uid: postgresUid },
}
