import { Component } from '../base/Сomponent';
import { ensureElement } from '../../utils/utils';
import { ISuccessView } from '../../types';

interface ISuccessActions {
	onClick: () => void;
}

export class Success extends Component<ISuccessView> {
	protected _close: HTMLElement;
	protected _total: HTMLElement;

	constructor(container: HTMLElement, actions?: ISuccessActions) {
		super(container);

		this._total = ensureElement<HTMLElement>(
			'.order-success__description',
			this.container
		);
		this._close = ensureElement<HTMLElement>(
			'.order-success__close',
			this.container
		);

		if (actions?.onClick) {
			this._close.addEventListener('click', actions.onClick);
		}
	}
	set total(value: number) {
		this.setText(this._total, `Списано ${value} синапсов`);
	}
}