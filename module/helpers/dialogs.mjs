// Envoltorios de DialogV2 compartidos por sheets, documentos y tiradas.
// Normalizan la semántica de los antiguos Dialog V1: cancelar o cerrar
// siempre resuelve null, aceptar resuelve lo que devuelva `read`.

function contentRoot(dialog) {
  if (dialog instanceof HTMLElement) return dialog;
  return dialog?.element instanceof HTMLElement ? dialog.element : null;
}

/**
 * Diálogo de formulario con botón de aceptar y cancelar.
 * `read(fields)` recibe los elementos nombrados del formulario del diálogo
 * (form.elements) y su valor de retorno resuelve la promesa.
 * `onRender(root)` permite enganchar listeners al contenido ya renderizado.
 */
export async function formDialog({ title, content, okLabel, okIcon = 'fas fa-dice-d10', onRender = null, read }) {
  const result = await foundry.applications.api.DialogV2.wait({
    window: { title },
    content,
    rejectClose: false,
    render: (event, dialog) => {
      const root = contentRoot(dialog);
      if (onRender && root) onRender(root);
    },
    buttons: [
      {
        action: 'ok',
        label: okLabel ?? game.i18n.localize('RYF.Roll'),
        icon: okIcon,
        default: true,
        callback: (event, button) => read(button.form.elements)
      },
      {
        action: 'cancel',
        label: game.i18n.localize('RYF.Cancel'),
        icon: 'fas fa-times',
        callback: () => null
      }
    ]
  });

  // Sin callback con valor, DialogV2 resuelve el id de la acción
  if (result === 'cancel' || result === 'ok' || result === undefined) return null;
  return result;
}

/** Confirmación sí/no; cerrar el diálogo equivale a "no". */
export async function confirmDialog({ title, content }) {
  const result = await foundry.applications.api.DialogV2.confirm({
    window: { title },
    content,
    rejectClose: false
  });
  return result === true;
}

/**
 * Diálogo de elección entre varios botones. Resuelve la `action` del botón
 * pulsado, o null si se cierra sin elegir.
 */
export async function choiceDialog({ title, content, choices }) {
  const result = await foundry.applications.api.DialogV2.wait({
    window: { title },
    content,
    rejectClose: false,
    buttons: choices.map(choice => ({
      action: choice.action,
      label: choice.label,
      icon: choice.icon,
      default: !!choice.default,
      callback: () => choice.action
    }))
  });
  return result ?? null;
}
