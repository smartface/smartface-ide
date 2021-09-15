import { Express } from 'express';
import createApi from './modules/assets/createApi';
import createImageApi from './modules/assets/imageApi';


export  function initRestServices(app: Express){
	app.get('/', (req, res) => {
		res.status(200).send('Smartface dispatcher is up and running').end();
	});

	createImageApi(app);
	createApi(app);
}