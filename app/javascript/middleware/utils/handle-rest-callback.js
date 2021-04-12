import { push } from "connected-react-router";

import setCaseIncidentData from "./set-case-incident-data";

const handleRestCallback = (store, callback, response, json, fromQueue = false) => {
  const isArrayCallback = Array.isArray(callback);

  if (callback?.setCaseIncidentData) {
    setCaseIncidentData(store, json?.data);
  }

  if (callback && (!fromQueue || callback?.api?.performFromQueue || isArrayCallback)) {
    if (isArrayCallback) {
      callback.forEach(cb => {
        const { dispatchIfStatus } = cb;

        if (dispatchIfStatus && response?.status !== dispatchIfStatus) {
          return;
        }
        handleRestCallback(store, cb, response, json, fromQueue);
      });
    } else {
      const isObjectCallback = typeof callback === "object";
      const isApiCallback = isObjectCallback && "api" in callback;

      const successPayload = isObjectCallback
        ? {
            type: callback.action,
            payload: callback.payload
          }
        : {
            type: callback,
            payload: { response, json }
          };

      store.dispatch(isApiCallback ? { type: callback.action, api: callback.api } : successPayload);

      if (isObjectCallback && callback.redirect && !fromQueue) {
        let { redirect } = callback;

        if (callback.redirectWithIdFromResponse) {
          redirect = `${callback.redirect}/${json?.data?.id}`;
        }
        if (callback.redirectToEdit) {
          redirect = `${callback.redirect}/${json?.data?.id}/edit`;
        }
        if (callback.incidentPath) {
          redirect = callback.incidentPath === "new" ? `/incidents/${callback.moduleID}/new` : callback.incidentPath;
        }

        store.dispatch(push(redirect));
      }
    }
  }
};

export default handleRestCallback;
