import './scss/styles.scss';

import { ContactForm, IProductView, PaymentForm, CatalogChangeEvent, } from './types';
import { IFormState } from './components/base/Form';
import { AppState } from './components/Communication/SpecialData';
import { SpecialAPI } from './components/Communication/SpecialAPI';


import { EventEmitter } from './components/base/events';

import { Product } from './components/view/Product';
import { API_URL, CDN_URL } from './utils/constants';
import { cloneTemplate, ensureElement } from './utils/utils';

import { Page } from './components/view/Page';
import { Basket } from './components/view/Basket';
import { Contacts } from './components/view/Contacts';
import { Success } from './components/view/Success';
import { Payment } from './components/view/Payment';
import { ModalData } from './components/base/Modal';

const api = new SpecialAPI(CDN_URL, API_URL);
const appData = new AppState(events);
const events = new EventEmitter();

const page = new Page(document.body, events);

const cardTemlate = ensureElement<HTMLTemplateElement>('#card-catalog');

// Получение данных карточек товарав с сервера
api.getProductList()
  .then(appData.setCatalog.bind(appData))
  .catch((err) => {
    console.error("Ошибка загрузки списка продуктов:", err.response ? err.response.data : err.message);
  });

// Отображение карточек в галерее после подгрузки данных
events.on<CatalogChangeEvent>('catalog:changed', () => {
	page.catalog = appData.catalog.map((item: IProductView) => {
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

const modal = new ModalData(ensureElement<HTMLElement>('#modal-container'), events);
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#card-preview');

events.on('preview:change', (item: IProductView) => {
	const card = new Product(cloneTemplate(cardPreviewTemplate), {
		onClick: () => {
			if (!item.cartPresence) {
				events.emit('products:add', item);
			} else {
				events.emit('products:remove', item);
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

// КОРЗИНА

const BasketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const cardInBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const basketCard = new Basket(cloneTemplate(BasketTemplate),events);


// Добавление товара в корзину
events.on('products:add', (item: IProductView) => {
    appData.addToBasket(item);
    delete item.cartPresence; // добавляем сброс значения
    modal.close();
});

// Удаление товара из корзины
events.on('products:remove', (item: IProductView) => {
    appData.removeFromBasket(item);
    delete item.cartPresence; // добавляем сброс значения
    modal.close();
});

// Блокировка скролла при открытии модального окна
events.on('modal:open', () => {
	page.locked = true;
});


// Разблокировка скролла при закрытии модального окна
events.on('modal:close', () => {
	page.locked = false;
});


// Отображение модального окна корзины
events.on('payment:select', () => {
	// Активируем кнопку "Оформить" если в корзину добавлен товар
	basketCard.buttonToggler = appData.catalog.map((item) => item.id); 
	modal.render({
		content: basketCard.render({
			total: appData.getTotal(),
		}),
	});
	page.locked = true;
});

// Изменение наполнения корзины
events.on('shoppingCart:change', () => {
	page.counter = appData.countBasket();
	basketCard.total = appData.getTotal();
	basketCard.items = appData.catalog.map((item, cartItemIndex) => {
		const card = new Product(cloneTemplate(cardInBasketTemplate), {
			onClick: () => {
				events.emit('cardInShoppingCart:remove', item);
				// Проверяем, не пора ли блокировать кнопку, если в корзине не осталось товаров
				basketCard.buttonToggler = appData.payment.map((item) => item.id)
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
events.on('cardInShoppingCart:remove', (item: IProductView) => {
	appData.removeFromBasket(item);
});

// ОФОРМЛЕНИЕ ЗАКАЗА
const paymentTemplate = ensureElement<HTMLTemplateElement>('#order');
const contactTemplate = ensureElement<HTMLTemplateElement>('#contacts');
const payments = new Payment(cloneTemplate(paymentTemplate), events);
const contacts = new Contacts(cloneTemplate(contactTemplate), events);

// Отображение модального окна формы ввода способа оплаты и адреса доставки
events.on('goToOrder:submit', () => {
	const initialState: Partial<PaymentForm> & IFormState = {
		valid: false,
		errors: [],
		address: '',
		payment: 'card',
	};
	const paymentContent = payments.render(initialState);
	modal.content = paymentContent;
});

// отображение модального окна формы ввода электронной почты и номера телефона
events.on('order:submit', () => {
	const initialState: Partial<ContactForm> & IFormState = {
		phone:  '',
		email:  '',
		valid: false,
		errors: [],
	};
	const contactsContent = contacts.render(initialState);
	modal.content = contactsContent;
});


// Изменилось состояние валидации формы ввода способа оплаты и адреса доставки
events.on('PaymentsFormErrors:change', (errors: Partial<PaymentForm>) => {
	const { address, payment } = errors;
	payments.valid = !payment && !address;
	payments.errors = Object.values({ payment, address })
		.filter((i) => !!i)
		.join('; ');
});

// Изменилось состояние валидации формы ввода электронной почты и номера телефона
events.on(
	'ContactsFormErrors:change',
	(errors: Partial<ContactForm>) => {
		const { email, phone } = errors;
		contacts.valid = !email && !phone;
		contacts.errors = Object.values({ email, phone })
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
	api.orderProducts({...appData.order, items: appData.catalog.map((item) => item.id), total: appData.getTotal()})
		.then((res) => {
			appData.clearBasket(),
			basketCard.resetCartView();
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
