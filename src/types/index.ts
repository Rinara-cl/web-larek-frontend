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


//Тип оплаты
export type PaymentMethod = 'cash'| 'card';


// Интерфейс заказа
export interface IOrder {
    items: string[];
	payment: PaymentForm | string;
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
export type PaymentForm = Pick<IOrder, 'payment' | 'address'>;

// Тип Формы Контактов покупателя
export type ContactForm = Pick<IOrder, 'email' | 'phone' | 'address'>;

// Интерфейс успешной оплаты
export interface ISuccessView {
    id: string;
    total: number;
}

// Интерфейс класса Success
export interface ISuccessActions {
	onClick: () => void;
}

// Форма ошибки
export type FormErrors = Partial<Record<keyof IOrder, string>>;



// Интерфейс корзины
export interface IBasketView {
	items: HTMLElement[];
	total: number;
	buttonToggler: string[];
}


// тип каталога
export type CatalogChangeEvent = {
	catalog: IProductView[];
};

