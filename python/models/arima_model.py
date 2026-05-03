import sys
import numpy as np
from statsmodels.tsa.stattools import adfuller
from statsmodels.tsa.arima.model import ARIMA
import warnings
warnings.filterwarnings('ignore')

class ARIMAPredictor:
    def __init__(self):
        self.model = None
        self.model_fit = None
        
    def check_stationarity(self, data):
        """
        Uji ADF untuk stasioneritas
        """
        result = adfuller(data)
        return {
            'adf_statistic': float(result[0]),
            'p_value': float(result[1]),
            'is_stationary': bool(result[1] < 0.05)
        }
    
    def find_best_order(self, data, max_p=3, max_d=2, max_q=3):
        """
        Grid search untuk menemukan order ARIMA terbaik berdasarkan AIC
        """
        best_aic = np.inf
        best_order = None
        
        for p in range(max_p + 1):
            for d in range(max_d + 1):
                for q in range(max_q + 1):
                    try:
                        model = ARIMA(data, order=(p, d, q))
                        fitted = model.fit()
                        
                        if fitted.aic < best_aic:
                            best_aic = fitted.aic
                            best_order = (p, d, q)
                    except:
                        continue
        
        return best_order, best_aic
    
    def fit(self, data, order=None):
        """
        Fit model ARIMA
        """
        if order is None:
            order, aic = self.find_best_order(data)
            # PENTING: Print ke stderr, bukan stdout!
            print(f"Best order found: {order} with AIC: {aic}", file=sys.stderr)
        
        self.model = ARIMA(data, order=order)
        self.model_fit = self.model.fit()
        
        return {
            'order': list(order),
            'aic': float(self.model_fit.aic),
            'bic': float(self.model_fit.bic)
        }
    
    def predict(self, steps=4):
        """
        Prediksi n-steps ke depan
        """
        if self.model_fit is None:
            raise ValueError("Model belum di-fit. Jalankan fit() terlebih dahulu.")
        
        forecast = self.model_fit.forecast(steps=steps)
        
        return {
            'predictions': [float(x) for x in forecast.tolist()],
            'steps': steps
        }
    
    def evaluate(self, test_data):
        """
        Evaluasi model dengan data test
        """
        predictions = self.model_fit.forecast(steps=len(test_data))
        
        # MAE
        mae = np.mean(np.abs(test_data - predictions))
        
        # RMSE
        rmse = np.sqrt(np.mean((test_data - predictions) ** 2))
        
        # MAPE
        mape = np.mean(np.abs((test_data - predictions) / test_data)) * 100
        
        return {
            'mae': float(mae),
            'rmse': float(rmse),
            'mape': float(mape)
        }