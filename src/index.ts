import './scss/styles.scss';

import { IProductView, ContactForm, PaymentForm, CatalogChangeEvent } from './types';
import { cloneTemplate, ensureElement } from './utils/utils';
import { API_URL, CDN_URL } from './utils/constants';

import { EventEmitter } from './components/base/events';

import { SpecialAPI } from './components/Communication/SpecialAPI';
import { SpecialData } from './components/Communication/SpecialData';

import { Page } from './components/view/Page';
import { Product } from './components/view/Product';

import { ModalData } from './components/view/ModalData';
import { Basket } from './components/view/Basket';
import { Success } from './components/view/Success';
import { Payment } from './components/view/Payment';
import { Contacts } from './components/view/Contacts';

const events = new EventEmitter();
const api = new SpecialAPI(CDN_URL, API_URL);
const appData = new SpecialData({}, events);
const page = new Page(document.body, events);

// КАРТОЧКИ

const cardTemlate = ensureElement<HTMLTemplateElement>('#card-catalog');

// Получение данных карточек товарав с сервера
api.getProductList()
	.then(appData.setCatalogProducts.bind(appData))
	.catch((err) => {
		console.error(err);
	});

// Отображение карточек в галерее после подгрузки данных
events.on<CatalogChangeEvent>('catalog:change', () => {
	page.catalog = appData.catalog.map((item) => {
		const card = new Product(cloneTemplate(cardTemlate), {
			onClick: () => events.emit('preview:change', item),
		});
		return card.render({
			title: item.title,
			image: item.image,
			price: item.price,
			category: item.category,
		});
	});
});

// Отображение модального окна карточки товара
const modal = new ModalData(ensureElement<HTMLElement>('#modal-container'), events);
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#card-preview');

events.on('preview:change', (item: IProductView) => {
	const card = new Product(cloneTemplate(cardPreviewTemplate), {
		onClick: () => {
			if (!item.cartPresence) {
				events.emit('productCard:add', item);
			} else {
				events.emit('productCard:remove', item);
			}
			card.changeButtonDescription(item.cartPresence);
		},
	});
	modal.render({
		content: card.render({
			id: item.id,
			title: item.title,
			image: item.image,
			description: item.description,
			cartPresence: item.cartPresence,
			category: item.category,
			price: item.price,
		}),
	});
	page.locked = true;
});

// Разблокировка скролла при закрытии модального окна
events.on('modal:close', () => {
	page.locked = false;
});

// КОРЗИНА

const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const cartPresenceBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const basket = new Basket(cloneTemplate(basketTemplate),events);

// Добавление товара в корзину
events.on('productCard:add', (item: IProductView) => {
	item.cartPresence = true;
	appData.addToBasketProducts(item);
	modal.close();
});

// Удаление товара из корзины
events.on('product:remove', (item: IProductView) => {
	item.cartPresence = false;
	appData.removeFromBasketProducts(item);
	modal.close();
});

// Отображение модального окна корзины
events.on('basket:select', () => {
	// Активируем кнопку "Оформить" если в корзину добавлен товар
	basket.buttonToggler = appData.basket.map((item) => item.id); 
	modal.render({
		content: basket.render({
			total: appData.getTotalProducts(),
		}),
	});
	page.locked = true;
});

// Изменение наполнения корзины
events.on('basket:change', () => {
	page.counter = appData.countBasketProducts();
	basket.total = appData.getTotalProducts();
	basket.items = appData.basket.map((item, cartItemIndex) => {
		const card = new Product(cloneTemplate(cartPresenceBasketTemplate), {
			onClick: () => {
				events.emit('cardInShoppingCart:remove', item);
				// Проверяем, не пора ли блокировать кнопку, если в корзине не осталось товаров
				basket.buttonToggler = appData.basket.map((item) => item.id)
			},
		});
		return card.render({
			cartItemIndex: cartItemIndex + 1,
			title: item.title,
			price: item.price,
		});
	});
});

// Событие удаления карточки товара из корзины без закрытия модального окна корзины
events.on('cartPresenceBasket:remove', (item: IProductView) => {
	appData.removeFromBasketProducts(item);
});

// ОФОРМЛЕНИЕ ЗАКАЗА
const paymentTemplate = ensureElement<HTMLTemplateElement>('#order');
const contactTemplate = ensureElement<HTMLTemplateElement>('#contacts');
const payment = new Payment(cloneTemplate(paymentTemplate), events);
const contact = new Contacts(cloneTemplate(contactTemplate),events);

// Отображение модального окна формы ввода способа оплаты и адреса доставки
events.on('goToOrder:submit', () => {
	modal.render({
		content: payment.render({
			valid: false,
			errors: [],
			payment: '',
			address: '',
		}),
	});
});

// отображение модального окна формы ввода электронной почты и номера телефона
events.on('order:submit', () => {
	modal.render({
		content: contact.render({
			valid: false,
			errors: [],
			phone: '',
			email: '',
		}),
	});
});

// Изменилось состояние валидации формы ввода способа оплаты и адреса доставки
// Отловили изменение состояния валидации формы оплаты
events.on('PaymentFormErrors:change', (errors: Partial<PaymentForm>) => {
    let isValid = true;                   // Флаг, определяющий общую валидность формы
    const errorMessages: string[] = [];   // Массив для сбора сообщений об ошибках

    for (let key of ['address', 'payment'] as Array<keyof PaymentForm>) {
        if (errors[key]) {
            isValid = false;              // Одна из ошибок присутствует
            errorMessages.push(errors[key]);
        }
    }

    payment.valid = isValid;               // Установить статус валидности формы
    payment.errors = errorMessages.join('; '); // Объединить ошибки в одну строку
});

// Изменилось состояние валидации формы ввода электронной почты и номера телефона
events.on(
	'ContactFormErrors:change',
	(errors: Partial<ContactForm>) => {
		const { email, phone } = errors;
		contact.valid = !email && !phone;
		contact.errors = Object.values({ email, phone })
			.filter((i) => !!i)
			.join('; ');
	}
);

// Изменилось одно из полей формы ввода способа оплаты и адреса доставки
events.on(
	/^order\..*:change/,
	(data: { field: keyof PaymentForm; value: string }) => {
		appData.setPaymentField(data.field, data.value);
	}
);

// Изменилось одно из полей формы электронной почты и номера телефона
events.on(
	/^contacts\..*:change/,
	(data: { field: keyof ContactForm; value: string }) => {
		appData.setContactField(data.field, data.value);
	}
);

// Завершение заказа, отправка сформированного заказа на сервер
const successTemplate = ensureElement<HTMLTemplateElement>('#success');
const success = new Success(cloneTemplate(successTemplate),{onClick:()=> modal.close()})

events.on('contacts:submit', () => {
	api.orderProducts({...appData.order, items: appData.basket.map((item) => item.id), total: appData.getTotalProducts()})
		.then((res) => {
			appData.clearBasketProducts(),
			basket.resetBasketView(),
			appData.clearOrder(),
			page.counter = 0,
			modal.render({
				content: success.render({
				total: res.total,
				}),
			});
		})
		.catch((error) => {
			console.log(error);
		});
});
