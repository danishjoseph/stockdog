import { Repository, FindOneOptions, SelectQueryBuilder } from 'typeorm';

export interface DatabaseRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: any): Promise<T | null>;
  create(item: T): Promise<T>;
  update(id: string, item: T): Promise<T | null>;
  delete(id: string): Promise<void>;
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

  async create(item: T): Promise<T> {
    return this.repository.save(item);
  }

  async update(id: string, item: T): Promise<T | null> {
    const existingItem = await this.repository.findOne(id as FindOneOptions<T>)
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
  
  createQueryBuilder(alias: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }
}
