import { screen, fireEvent } from '@testing-library/dom';
import { ROUTES_PATH } from '../constants/routes.js';
import NewBill from '../containers/NewBill.js';
import NewBillUI from '../views/NewBillUI.js';

describe('Given I am connected as an employee', () => {
  describe('When I navigate to the New Bill page', () => {
    let formNewBill, onNavigate, newBillContainer;

    beforeEach(() => {
      // 1) on affiche la page
      document.body.innerHTML = NewBillUI();

      // 2) on simule un user déjà logué (pour que handleSubmit puisse lire localStorage)
      window.localStorage.setItem(
        'user',
        JSON.stringify({ type: 'Employee', email: 'test@billed.app' })
      );

      // 3) on récupère le form et on prépare le spy onNavigate
      formNewBill = screen.getByTestId('form-new-bill');
      onNavigate = jest.fn();

      // 4) on instancie le container (c’est lui qui fait addEventListener)
      newBillContainer = new NewBill({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });
    });

    test('Then, it should render the new-bill form', () => {
      expect(formNewBill).toBeTruthy();
    });

    describe('And when I submit the form', () => {
      test('Then, it should navigate to Bills', () => {
        // on simule l’envoi du formulaire
        fireEvent.submit(formNewBill);

        // et on vérifie l’appel à onNavigate avec la bonne route
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
      });
    });
  });
});
