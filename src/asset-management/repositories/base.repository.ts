import {
  Repository,
  FindOneOptions,
  SelectQueryBuilder,
  FindOptionsWhere,
  InsertResult,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { UpsertOptions } from 'typeorm/repository/UpsertOptions';

export interface DatabaseRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: any): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, item: T): Promise<T | null>;
  delete(id: string): Promise<void>;
  upsert(
    item: QueryDeepPartialEntity<T>,
    options: UpsertOptions<T>,
  ): Promise<InsertResult>;
  createQueryBuilder(alias: string): SelectQueryBuilder<T>;
}

export abstract class BaseRepository<T> implements DatabaseRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async findById(id: any): Promise<T | null> {
    return this.repository.findOne(id);
  }

  async findOneBy(
    props: FindOptionsWhere<T>,
    relations?: string[],
  ): Promise<T | null> {
    return this.repository.findOne({ where: props, relations: relations });
  }

  async create(item: T): Promise<T> {
    return this.repository.save(item);
  }

  async update(id: string, item: T): Promise<T | null> {
    const existingItem = await this.repository.findOne(id as FindOneOptions<T>);
    if (!existingItem) {
      return null;
    }
    const updatedItem = { ...existingItem, ...item };
    await this.repository.save(updatedItem);
    return updatedItem;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async upsert(
    item: QueryDeepPartialEntity<T>,
    options: UpsertOptions<T>,
  ): Promise<InsertResult> {
    return this.repository.upsert(item, options);
  }

  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }
}
