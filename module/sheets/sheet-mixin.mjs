const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Base común de las sheets ApplicationV2 del sistema: pestañas manuales
 * (persisten entre re-renders), edición de la imagen de perfil y enrutado de
 * los data-action de las plantillas hacia `_handleSheetAction`.
 */
export function RyfSheetMixin(Base) {
  return class RyfSheet extends HandlebarsApplicationMixin(Base) {

    static INITIAL_TAB = 'details';

    #activeTab = null;

    _onRender(context, options) {
      super._onRender(context, options);
      this.#applyActiveTab();
    }

    _onClickAction(event, target) {
      const action = target.dataset.action;

      if (action === 'changeTab') {
        this._setActiveTab(target.dataset.tab);
        return;
      }

      if (action === 'editImage') {
        return this.#onEditImage(target);
      }

      return this._handleSheetAction(action, event, target);
    }

    /** Las subclases resuelven aquí sus data-action propios. */
    async _handleSheetAction(action, event, target) {}

    _setActiveTab(tab) {
      if (!tab) return;
      this.#activeTab = tab;
      for (const nav of this.element.querySelectorAll('.sheet-tabs [data-tab]')) {
        nav.classList.toggle('active', nav.dataset.tab === tab);
      }
      for (const section of this.element.querySelectorAll('.sheet-body .tab')) {
        section.classList.toggle('active', section.dataset.tab === tab);
      }
    }

    #applyActiveTab() {
      let tab = this.#activeTab ?? this.constructor.INITIAL_TAB;
      // Si la pestaña ya no existe (p. ej. magia desactivada), usar la primera
      if (!this.element.querySelector(`.sheet-body .tab[data-tab="${tab}"]`)) {
        tab = this.element.querySelector('.sheet-body .tab')?.dataset.tab;
      }
      this._setActiveTab(tab);
    }

    async #onEditImage(target) {
      const attr = target.dataset.edit || 'img';
      const current = foundry.utils.getProperty(this.document, attr);
      const FilePickerCls = foundry.applications.apps.FilePicker.implementation ?? foundry.applications.apps.FilePicker;
      const picker = new FilePickerCls({
        type: 'image',
        current: current,
        callback: path => this.document.update({ [attr]: path })
      });
      return picker.browse();
    }
  };
}
