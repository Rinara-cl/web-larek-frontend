import {
	IProductView,
	FormErrors,
	ContactForm,
	PaymentForm,
	IOrder,
	
} from '../../types';

import { IEvents } from '../base/events';

// Базовая модель
export abstract class Model<T> {
    constructor(data: Partial<T>, protected events: IEvents) {
        Object.assign(this, data);
    }

    emitChanges(event: string, payload?: object) {
        this.events.emit(event, payload ?? {});
    }
}

// Интерфейс приложения
export interface ISpecialData {
	selectedProduct: IProductView;
	basket: {}
	productList: IProductView[];
	currentOrder: IOrder;
}

export class SpecialData extends Model<ISpecialData> {
	catalog: IProductView[];
	basket: IProductView[] = [];
	// В поле сохраняется ID товара, отображаемого в модальном окне
	preview: string | null; 
	formErrors: FormErrors = {};
	// В поле сохраняются данные, введенные в формы при оформлении заказа
	order: PaymentForm & ContactForm = {
		payment: '',
		address: '',
		email: '',
		phone: ''
	};
	

	setCatalogProducts(productCards: IProductView[]) {
		this.catalog = productCards;
		this.emitChanges('catalog:change', { catalog: this.catalog });
	}
	// Получение данных одной карточки для ее отображения в модальном окне
	setPreviewProducts(item: IProductView) {
		this.preview = item.id;
		this.emitChanges('preview:change', item);
	}

	addToBasketProducts(item: IProductView) {
		this.basket.push(item);
		this.emitChanges('payment:change', item);
	}

	removeFromBasketProducts(item: IProductView) {
		const index = this.basket.indexOf(item);
		this.basket.splice(index, 1);
		item.cartPresence = false;
		this.emitChanges('payment:change', item);
	}

	// Подсчет количества товаров в корзине для вывода значения у иконки корзины на главной странице
	countBasketProducts() {
		return this.basket.length;
	}

	// Подсчет общей стоимости товаров в корзине
	getTotalProducts() {
		let summ = 0;
		this.basket.forEach((item) => {
			summ = summ + item.price;
		});

		return summ;
	}

	// Удаление всех товаров из корзины после завершения заказа
	clearBasketProducts() {
		this.catalog = [];
		this.basket.forEach((item) => {
			item.cartPresence = false;
		});
	}

	// Очистка полей форм после завершения заказа
	clearOrder() {
		this.order = {
			payment: '',
			address: '',
			email: '',
			phone: '',
		};
	}

	setPaymentField(field: keyof PaymentForm, value: string) {
		this.order[field] = value;
		if (this.validatePayment()) {
			return;
		}
	}

	validatePayment(): boolean {
		const errors: typeof this.formErrors = {};
		if (!this.order.payment) {
			errors.payment = 'Необходимо выбрать способ оплаты';
		}
		if (!this.order.address) {
			errors.address = 'Необходимо указать адрес доставки';
		}
		this.formErrors = errors;
		this.events.emit('UserDataFormErrors:change', this.formErrors);
		return Object.keys(errors).length === 0; // Если длина массива равна нулю (ошибок нет),
		// то выражение будет истинным, функция вернёт true
	}

	setContactField(field: keyof ContactForm, value: string) {
		this.order[field] = value;
		if (this.validateContact()) {
			return;
		}
	}

	validateContact(): boolean {
		const errors: typeof this.formErrors = {};
		if (!this.order.email) {
			errors.email = 'Необходимо указать email';
		}
		if (!this.order.phone) {
			errors.phone = 'Необходимо указать телефон';
		}
		this.formErrors = errors;
		this.events.emit('ContactFormErrors:change', this.formErrors);
		return Object.keys(errors).length === 0;
	}
}