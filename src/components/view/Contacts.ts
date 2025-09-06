import { ContactForm } from '../../types';
import { EventEmitter } from '../base/events';
import { Form } from '../base/Form';

export class Contacts extends Form<ContactForm> {
	constructor(container: HTMLFormElement, events: EventEmitter) {
		super(container, events);
	}

	set email(value: string) {
		(
			this.container.querySelector('input[name=email]') as HTMLInputElement
		).value = value;
	}

	set phone(value: string) {
		(
			this.container.querySelector('input[name=phone]') as HTMLInputElement
		).value = value;
	}
}