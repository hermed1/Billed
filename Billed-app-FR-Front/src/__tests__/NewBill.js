/**
 * @jest-environment jsdom
 */

import { screen } from '@testing-library/dom';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    test('Then ...', () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion
    });
  });
});
// describe('Given I am connected as an employee', () => {
//   describe('When I navigate to the New Bill page', () => {
//     let formNewBill, onNavigate, newBillContainer;

//     beforeEach(() => {
//       // 1) on affiche la page
//       document.body.innerHTML = NewBillUI();

//       // 2) on simule un user déjà logué (pour que handleSubmit puisse lire localStorage)
//       window.localStorage.setItem(
//         'user',
//         JSON.stringify({ type: 'Employee', email: 'test@billed.app' })
//       );

//       // 3) on récupère le form et on prépare le spy onNavigate
//       formNewBill = screen.getByTestId('form-new-bill');
//       onNavigate = jest.fn();

//       // 4) on instancie le container (c’est lui qui fait addEventListener)
//       newBillContainer = new NewBill({
//         document,
//         onNavigate,
//         store: null,
//         localStorage: window.localStorage,
//       });
//     });

//     test('Then, it should render the new-bill form', () => {
//       expect(formNewBill).toBeTruthy();
//     });

//     describe('And when I submit the form', () => {
//       test('Then, it should navigate to Bills', () => {
//         // on simule l’envoi du formulaire
//         fireEvent.submit(formNewBill);

//         // et on vérifie l’appel à onNavigate avec la bonne route
//         expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
//       });
//     });
//   });
// });

// On veut vérifier que l’envoi du formulaire :
// Appelle bien la méthode create du store (c’est l’appel réseau « Créer une note »).
// Relance ensuite la méthode list du store (pour récupérer la liste à jour).
// Redirige enfin l’utilisateur vers la page des Bills.

// describe('Integration NewBill', () => {
//   let formNewBill, newBillContainer, onNavigate;
//   const mockStore = {
//     bills: () => ({
//       create: jest.fn().mockResolvedValue(/* … simulate create … */),
//       list: jest.fn().mockResolvedValue(/* … simulate list … */),
//     }),
//   };

//   beforeEach(() => {
//     // 1) on injecte la vue « formulaire » dans jsdom
//     document.body.innerHTML = NewBillUI();

//     // 2) on simule un utilisateur connecté
//     window.localStorage.setItem(
//       'user',
//       JSON.stringify({ type: 'Employee', email: 'toto@billed.app' })
//     );

//     // 3) on prépare le spy onNavigate
//     onNavigate = jest.fn();

//     // 4) on instancie le container (c'est lui qui fait addEventListener)
//     newBillContainer = new NewBill({
//       document,
//       onNavigate,
//       store: mockStore, // ton store factice
//       localStorage: window.localStorage,
//     });

//     // 5) on récupère le <form> en mémoire
//     formNewBill = screen.getByTestId('form-new-bill');
//   });

//   test('submit appelle handleSubmit et onNavigate', async () => {
//     const spyCreate = jest.spyOn(mockStore.bills(), 'create');
//     const spyList = jest.spyOn(mockStore.bills(), 'list');
//     fireEvent.change(screen.getByTestId('expense-name'), {
//       target: { value: 'Repas client' },
//     });
//     await fireEvent.submit(formNewBill);

//     expect(spyCreate).toHaveBeenCalled(); // create() bien appelée
//     expect(spyList).toHaveBeenCalled(); // list() bien appelée
//     expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills); // redirection ok
//   });
// });
