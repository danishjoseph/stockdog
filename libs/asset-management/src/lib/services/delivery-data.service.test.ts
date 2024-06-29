import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryDataService } from './delivery-data.service';
import { DeliveryDataRepository } from '../repositories';
import { DeliveryData } from '../entities';

describe('DeliveryDataService', () => {
  let deliveryDataService: DeliveryDataService;
  let deliveryDataRepository: jest.Mocked<DeliveryDataRepository>;

  beforeEach(async () => {
    const repoMock = {
      findById: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryDataService,
        {
          provide: DeliveryDataRepository,
          useValue: repoMock,
        },
      ],
    }).compile();

    deliveryDataService = module.get<DeliveryDataService>(DeliveryDataService);
    deliveryDataRepository = module.get(DeliveryDataRepository);
  });

  it('should be defined', () => {
    expect(deliveryDataService).toBeDefined();
    expect(deliveryDataRepository).toBeDefined();
  });

  describe('findDeliveryDataById', () => {
    it('should return a delivery data if found', async () => {
      const result = new DeliveryData();
      deliveryDataRepository.findById.mockResolvedValue(result);

      expect(await deliveryDataService.findDeliveryDataById('1')).toBe(result);
      expect(deliveryDataRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw an error if delivery data not found', async () => {
      deliveryDataRepository.findById.mockResolvedValue(null);

      await expect(
        deliveryDataService.findDeliveryDataById('1'),
      ).rejects.toThrow();
      expect(deliveryDataRepository.findById).toHaveBeenCalledWith('1');
    });
  });
});
