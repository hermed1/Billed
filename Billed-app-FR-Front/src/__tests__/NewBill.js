/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from '@testing-library/dom';
import { ROUTES_PATH } from '../constants/routes.js';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    // test('Then ...', () => {
    //   const html = NewBillUI();
    //   document.body.innerHTML = html;
    //   //to-do write assertion
    // });
    let formNewBill, onNavigate;

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
    });
    //mettre describe pour ces deux tests
    test('Then, it should render the new-bill form', () => {
      expect(formNewBill).toBeTruthy();
    });
    test('then it should have the file input', () => {
      const fileInput = screen.getByTestId('file');
      expect(fileInput).toBeTruthy();
    });
    describe('when I upload a file', () => {
      test('Then, it should alert if the file type is not valid', () => {
        new NewBill({ document, onNavigate, store: null, localStorage });
        // on simule un fichier avec une extension invalide
        const fileInput = screen.getByTestId('file');
        //file = utilitaire de fichier de javascript
        const invalidFile = new File(['fake content'], 'test.pdf', {
          type: 'text/plain',
        });
        window.alert = jest.fn(); // positionne spy sur window.alert : vérifier ce que ça fait (voir si ça le répertorie au niveau de jest)
        fireEvent.change(fileInput, { target: { files: [invalidFile] } });

        // on vérifie que l’alerte a été appelée
        expect(window.alert).toHaveBeenCalledWith(
          'Seuls les fichiers .jpg, .jpeg ou .png sont acceptés.'
        );
      });
      test('Then, it should call store.create and save file infos if the file is valid', async () => {
        window.alert = jest.fn();
        //La méthode réelle store.bills().create renvoie une promesse : resolve ou reject .then/.catch)
        // qui se résout avec un objet contenant fileUrl et key.
        // mockResolvedValue = quand on appellera cette fonction, elle renverra automatiquement
        // une promesse qui se résout avec les deux valeurs suivantes.
        // (on simule les deux valeurs retournées par la vraie promesse (en cas de succès = réolution))

        // 1️⃣  On fabrique une fonction espionne (Jest spy) pour surveiller les appels à `create`
        const createMock = jest.fn().mockResolvedValue({
          fileUrl: 'https://img.test/avatar.png',
          key: '123abc',
        });

        // 2️⃣  On construit un faux store qui imite la vraie API
        //     Quand le composant fera `this.store.bills()`, il recevra cet objet
        //     — et la clé `create` qu’il trouvera sera exactement `createMock`.
        const mockStore = {
          bills: () => ({
            create: createMock, // ← ici on “branche” la fonction espionne
          }),
        };

        // 3️⃣  On instancie le container NewBill en lui injectant ce faux store
        const newBillContainer = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage,
        });
        const fileInput = screen.getByTestId('file');
        const pngFile = new File(['img'], 'note.png', { type: 'image/png' });
        //defineProperty = méthode js du type primaire objet (on va chercher l'objet fileInput et mettre à jour sa value à vérifier)
        Object.defineProperty(fileInput, 'value', {
          writable: true,
          value: 'C:\\fakepath\\note.png',
        });

        fireEvent.change(fileInput, {
          target: { files: [pngFile] },
        });
        //attend que la condition soit remplie
        // on attend que la promesse de createMock soit résolue
        await waitFor(() => expect(createMock).toHaveBeenCalled());

        expect(newBillContainer.fileName).toBe('note.png');
        expect(newBillContainer.fileUrl).toBe('https://img.test/avatar.png');
        expect(newBillContainer.billId).toBe('123abc');
        expect(window.alert).not.toHaveBeenCalled();
      });
      test("then, if there's an Error,handleChangeFile – gère une erreur API (catch)", async () => {
        // 1. on espionne console.error
        const consoleErrorSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        // 2. faux store dont create renvoie une promesse rejetée
        const createRejectMock = jest
          .fn()
          .mockRejectedValue(new Error('Erreur API'));
        const mockStore = { bills: () => ({ create: createRejectMock }) };

        // 3. instanciation du container avec ce store
        new NewBill({
          document,
          onNavigate: jest.fn(),
          store: mockStore,
          localStorage,
        });

        // 4. upload d’un fichier **valide** pour atteindre le catch
        const fileInput = screen.getByTestId('file');
        const pngFile = new File(['img'], 'note.png', { type: 'image/png' });
        // Rendre la propriété 'value' de l’input modifiable
        Object.defineProperty(fileInput, 'value', {
          writable: true, // autorise l’écriture de fileInput.value
          value: 'C:\\fakepath\\note.png', // simule le chemin renvoyé par le navigateur
        });
        fireEvent.change(fileInput, { target: { files: [pngFile] } });

        //waitFor renvoie une promesse qui se résout quand la condition est remplie
        await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());

        consoleErrorSpy.mockRestore(); // on remet console.error comme avant
      });
    });
    test('handleChangeFile affiche "Erreur 404" dans console.error', async () => {
      // prépare le DOM et l’utilisateur
      document.body.innerHTML = NewBillUI();
      window.localStorage.setItem(
        'user',
        JSON.stringify({ type: 'Employee', email: 'test@billed.app' })
      );

      // espionne console.error
      const err404 = new Error('Erreur 404');
      const spyError = jest
        // spyOn(objet, 'méthode') = espionne la méthode de l’objet, ici objet console
        .spyOn(console, 'error')
        //Remplace temporairement le corps de la méthode espionnée par la fonction callback.
        .mockImplementation(() => {});

      // store mocké dont create renvoie un rejet
      const store404 = {
        bills: () => ({ create: () => Promise.reject(err404) }),
      };

      // instancie le container
      new NewBill({
        document,
        onNavigate: jest.fn(),
        store: store404,
        localStorage,
      });

      // déclenche un upload PNG (fichier valide)
      const input = screen.getByTestId('file');
      const file = new File(['x'], 'facture.png', { type: 'image/png' });
      Object.defineProperty(input, 'value', {
        writable: true,
        value: 'C:\\fakepath\\facture.png',
      });
      fireEvent.change(input, { target: { files: [file] } });

      // attend que console.error ait loggé l’erreur
      await waitFor(() => expect(spyError).toHaveBeenCalledWith(err404));
      spyError.mockRestore();
    });
    /* ====== handleChangeFile rejette → « Erreur 500 » ======================= */
    test('handleChangeFile affiche "Erreur 500" dans console.error', async () => {
      // prépare DOM + user
      document.body.innerHTML = NewBillUI();
      window.localStorage.setItem(
        'user',
        JSON.stringify({ type: 'Employee', email: 'test@billed.app' })
      );

      const err500 = new Error('Erreur 500');
      const spyError = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // store mocké : create rejette avec 500
      const store500 = {
        bills: () => ({ create: () => Promise.reject(err500) }),
      };

      new NewBill({
        document,
        onNavigate: jest.fn(),
        store: store500,
        localStorage,
      });

      // déclenche upload PNG
      const input = screen.getByTestId('file');
      const file = new File(['x'], 'facture.png', { type: 'image/png' });
      Object.defineProperty(input, 'value', {
        writable: true,
        value: 'C:\\fakepath\\facture.png',
      });
      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => expect(spyError).toHaveBeenCalledWith(err500));
      spyError.mockRestore();
    });

    describe('And when I submit the form', () => {
      test('Then, it should navigate to Bills', () => {
        new NewBill({ document, onNavigate, store: null, localStorage });

        // on simule l’envoi du formulaire
        fireEvent.submit(formNewBill);
        // et on vérifie l’appel à onNavigate avec la bonne route
        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
      });
    });

    // * ➜ But : tester le POST complet d'une note de frais
    // *     - l’utilisateur choisit un fichier .png
    // *     - remplit quelques champs clés
    // *     - soumet le formulaire
    // *     - le container appelle store.create, puis store.update
    // *     - la navigation se fait vers la page Bills

    describe('INTégration – NewBill : POST complet', () => {
      const onNavigate = jest.fn();

      window.localStorage.setItem(
        'user',
        JSON.stringify({ type: 'Employee', email: 'test@billed.app' })
      );

      /* spies côté API */
      const createMock = jest.fn().mockResolvedValue({
        fileUrl: 'https://img.host/facture.png',
        key: 'bill123',
      });
      const updateMock = jest.fn().mockResolvedValue({});

      /* faux store injecté */
      const mockStore = {
        bills: () => ({
          create: createMock,
          update: updateMock,
        }),
      };

      test('POST : create → update → navigation Bills', async () => {
        /* ① monte l’UI et instancie le container */
        document.body.innerHTML = NewBillUI();
        new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage: window.localStorage,
        });

        /* ② Upload d’un PNG */
        const fileInput = screen.getByTestId('file');
        const pngFile = new File(['dummy'], 'facture.png', {
          type: 'image/png',
        });
        Object.defineProperty(fileInput, 'value', {
          writable: true,
          value: 'C:\\fakepath\\facture.png',
        });
        fireEvent.change(fileInput, { target: { files: [pngFile] } });

        await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));

        /* ③ Remplissage de quelques champs */
        screen.getByTestId('expense-name').value = 'Taxi Paris';
        screen.getByTestId('amount').value = '42';
        screen.getByTestId('datepicker').value = '2025-02-28';

        /* ④ Soumission du formulaire */
        fireEvent.submit(screen.getByTestId('form-new-bill'));

        await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));

        /* ⑤ Assertions finales */
        const createArgs = createMock.mock.calls[0][0];
        expect(createArgs.data instanceof FormData).toBe(true);
        expect(createArgs.headers?.noContentType).toBe(true);

        const updateBody = JSON.parse(updateMock.mock.calls[0][0].data);
        expect(updateBody.fileUrl).toBe('https://img.host/facture.png');
        expect(updateBody.fileName).toBe('facture.png');
        expect(updateBody.amount).toBe(42);
        expect(updateMock.mock.calls[0][0].selector).toBe('bill123');

        expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH.Bills);
      });
    });

    afterEach(() => {
      window.localStorage.clear();
      jest.clearAllMocks();
    });
  });
});
