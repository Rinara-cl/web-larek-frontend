// Интерфейс товаров, которые приходят через API
export interface IProductView {
    id: string;
	description: string;
	price: number | undefined;
	title: string;
	image: string;
	category: string;
	cartPresence?: boolean;
	cartItemIndex?: number;

};


// Интерфейс заказа
export interface IOrder {
    items: string[];
	payment: string;
	email: string;
	phone: string;
	address: string;
	total: number | undefined;
}

// Интерфейс корзины
export interface IBasket {
    items: string[];
    total: number;
}

// Тип Формы Способа оплаты
export type PaymentForm =  Omit<IOrder, 'total' | 'items'>;

// Тип Формы Контактов покупателя
export type ContactForm =  Omit<IOrder, 'total' | 'items' | 'payment' | 'address'>;


// Форма ошибки
export type FormErrors = Partial<Record<keyof IOrder, string>>;


// тип каталога
export type CatalogChangeEvent = {
	catalog: IProductView[];
};

