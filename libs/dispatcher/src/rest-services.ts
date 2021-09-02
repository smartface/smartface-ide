import { Express } from 'express';
import createApi from './modules/assets/createApi';
import createImageApi from './modules/assets/imageApi';


export  function initRestServices(app: Express){
	// For CORS
	app.use((req, res, next) => {
		const origin = req.get('origin');
		origin && res.header('Access-Control-Allow-Origin', req.header('origin'));
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
		res.header('Access-Control-Allow-Credentials', 'true');
		next();
	});

	app.get('/', (req, res) => {
		res.status(200).send('Smartface dispatcher is up and running').end();
	});

	createImageApi(app);
	createApi(app);
}