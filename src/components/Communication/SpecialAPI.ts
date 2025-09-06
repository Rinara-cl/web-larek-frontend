import { Api } from '../base/api';
import { ApiListResponse } from '../../types';
import { IProductView, IOrder, IBasket } from '../../types';


export interface ISpecialApi extends Api  {
	getProductList: () => Promise<IProductView[]>;
    getProductItem: (id: string) => Promise<IProductView>;
	orderProducts: (order: IOrder) => Promise<IBasket>;
}

export class SpecialAPI extends Api implements ISpecialApi {
    readonly cdn: string;

    constructor(cdn: string, baseUrl: string, options?: RequestInit) {
        super(baseUrl, options);
        this.cdn = cdn;
    }

    getProductList(): Promise<IProductView[]> {
        return this.get('/product').then((data: ApiListResponse<IProductView>) =>
            data.items.map((item) => ({
                ...item,
                image: this.cdn + item.image
            }))
        );
    }
    
    getProductItem(id: string): Promise<IProductView> {
        return this.get(`/product/${id}`).then(
            (item: IProductView) => ({
                ...item,
                image: this.cdn + item.image,
            })
        );
    }

    orderProducts(order: IOrder): Promise<IBasket> {
        return this.post('/order', order).then(
            (data: IBasket) => data
        );
    }

}