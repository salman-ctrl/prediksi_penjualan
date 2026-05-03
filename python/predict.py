import sys
import os
import json
import mysql.connector
import pandas as pd
from datetime import datetime
from models.arima_model import ARIMAPredictor

def get_db_connection():
    return mysql.connector.connect(
        host=os.environ.get('DB_HOST', 'tramway.proxy.rlwy.net'),
        port=int(os.environ.get('DB_PORT', 49107)),
        user=os.environ.get('DB_USER', 'root'),
        password=os.environ.get('DB_PASSWORD', 'nNURHuXfklFNlrsqyvBjtlmiPZBJYwHU'),
        database=os.environ.get('DB_NAME', 'railway')
    )

def fetch_weekly_sales(start_date, end_date):
    conn = get_db_connection()
    
    query = """
        SELECT 
            YEARWEEK(created_at, 1) AS minggu,
            MIN(created_at) AS tanggal_awal_minggu,
            SUM(total_price) AS total_penjualan
        FROM transactions
        WHERE status = 'paid'
          AND created_at BETWEEN %s AND %s
        GROUP BY YEARWEEK(created_at, 1)
        ORDER BY minggu ASC
    """
    
    try:
        df = pd.read_sql(query, conn, params=(start_date, end_date))
        if not df.empty:
            df['tanggal_awal_minggu'] = pd.to_datetime(df['tanggal_awal_minggu'])
            
    except Exception as e:
        print(f"❌ Database Error: {e}", file=sys.stderr)
        df = pd.DataFrame()
    finally:
        conn.close()
    
    print(f"✅ Data diambil: {start_date} s/d {end_date} ({len(df)} minggu)", file=sys.stderr)
    
    return df

def fetch_weekly_sales_until_now(start_date):
    end_date = datetime.now().strftime('%Y-%m-%d')
    return fetch_weekly_sales(start_date, end_date)

def main():
    try:
        if len(sys.argv) < 4:
            raise ValueError("Parameter tidak lengkap. Format: python predict.py YYYY-MM-DD YYYY-MM-DD <steps>")
        
        start_date = sys.argv[1]
        end_date = sys.argv[2]
        forecast_steps = int(sys.argv[3])
        
        print(f"📅 Periode: {start_date} s/d {end_date}", file=sys.stderr)
        print(f"🔮 Forecast: {forecast_steps} minggu", file=sys.stderr)
        print("", file=sys.stderr)
        
        df = fetch_weekly_sales(start_date, end_date)
        
        if len(df) < 10:
            raise ValueError(f"❌ Data tidak cukup! Hanya {len(df)} minggu data valid (status='paid'). Minimal butuh 10 minggu data historis.")
        
        sales_data = df['total_penjualan'].values
        
        print(f"📊 Data penjualan:", file=sys.stderr)
        print(f"   Total minggu: {len(sales_data)}", file=sys.stderr)
        print(f"   Min: Rp {sales_data.min():,.0f}", file=sys.stderr)
        print(f"   Max: Rp {sales_data.max():,.0f}", file=sys.stderr)
        print(f"   Rata-rata: Rp {sales_data.mean():,.0f}", file=sys.stderr)
        print("", file=sys.stderr)
        
        predictor = ARIMAPredictor()
        
        print("🔍 Mengecek stasioneritas data...", file=sys.stderr)
        stationarity = predictor.check_stationarity(sales_data)
        
        if stationarity['is_stationary']:
            print(f"   ✅ Data stasioner (p-value: {stationarity['p_value']:.4f})", file=sys.stderr)
        else:
            print(f"   ⚠️  Data non-stasioner (p-value: {stationarity['p_value']:.4f})", file=sys.stderr)
            print("   Model akan melakukan differencing...", file=sys.stderr)
        print("", file=sys.stderr)
        
        print("🎓 Training model ARIMA...", file=sys.stderr)
        model_info = predictor.fit(sales_data)
        print(f"   Best order: {model_info['order']}", file=sys.stderr)
        print(f"   AIC: {model_info['aic']:.2f}", file=sys.stderr)
        print(f"   BIC: {model_info['bic']:.2f}", file=sys.stderr)
        print("", file=sys.stderr)
        
        print(f"🔮 Prediksi {forecast_steps} minggu ke depan:", file=sys.stderr)
        predictions = predictor.predict(steps=forecast_steps)
        
        for i, pred in enumerate(predictions['predictions'], 1):
            print(f"   Week +{i}: Rp {pred:,.0f}", file=sys.stderr)
        print("", file=sys.stderr)
        
        print("✅ Prediksi berhasil!", file=sys.stderr)
        
        result = {
            'success': True,
            'data': {
                'historical_data': {
                    'dates': df['tanggal_awal_minggu'].dt.strftime('%Y-%m-%d').tolist(),
                    'values': sales_data.tolist()
                },
                'predictions': predictions['predictions'],
                'model_info': {
                    'order': model_info['order'],
                    'aic': float(model_info['aic']),
                    'bic': float(model_info['bic'])
                },
                'stationarity': stationarity,
                'summary': {
                    'total_weeks': len(sales_data),
                    'min_sales': float(sales_data.min()),
                    'max_sales': float(sales_data.max()),
                    'avg_sales': float(sales_data.mean())
                }
            }
        }
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'success': False,
            'message': str(e),
            'error': str(e)
        }
        print(json.dumps(error_result))
        print(f"❌ Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()