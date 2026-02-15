import { Test, TestingModule } from '@nestjs/testing';
import { MestaService } from './mesta.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('MestaService', () => {
    let service: MestaService;
    let configService: ConfigService;

    const mockConfigService = {
        get: jest.fn((key: string) => {
            if (key === 'mesta.baseUrl') return 'https://api.mesta.com';
            if (key === 'mesta.apiKey') return 'mock-api-key';
            if (key === 'mesta.apiSecret') return 'mock-api-secret';
            return null;
        }),
    };

    beforeEach(async () => {
        const mockAxiosInstance = {
            post: jest.fn(),
            get: jest.fn(),
            interceptors: {
                response: {
                    use: jest.fn(),
                },
            },
        };
        mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MestaService,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<MestaService>(MestaService);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createSender', () => {
        it('should call axios.post with correct payload', async () => {
            const dto = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+1234567890',
                addresses: [
                    {
                        street: '123 Main St',
                        city: 'New York',
                        state: 'NY',
                        country: 'US',
                        postalCode: '10001',
                    },
                ],
            };

            const mockResponse = { data: { id: 'mesta-123' } };
            // Retrieve the mock instance we set up in beforeEach
            const mockInstance = mockedAxios.create();
            (mockInstance.post as jest.Mock).mockResolvedValue(mockResponse);

            const result = await service.createSender(dto as any);

            expect(mockInstance.post).toHaveBeenCalledWith('/senders', dto);
            expect(result).toEqual(mockResponse.data);
        });
    });
});
