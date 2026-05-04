const { spawn } = require('child_process');
const path = require('path');
const { successResponse, errorResponse } = require('../utils/response');

exports.runPrediction = async (req, res) => {
  try {
    const { start_date, end_date, forecast_steps = 4 } = req.body;

    if (!start_date || !end_date) {
      return errorResponse(res, 400, 'Parameter start_date dan end_date wajib diisi');
    }

    console.log('🔮 Starting ARIMA prediction...');
    console.log(`   Period: ${start_date} to ${end_date}`);
    console.log(`   Steps: ${forecast_steps}`);

    const pythonScriptPath = path.join(__dirname, '../../python/predict.py');

    // FIX: Pakai system python3 di Linux/Render, venv hanya untuk Windows lokal
    const isWindows = process.platform === 'win32';
    const pythonPath = isWindows
      ? path.join(__dirname, '../../../python/venv/Scripts/python.exe')
      : 'python3';

    console.log(`   Python: ${pythonPath}`);
    console.log(`   Script: ${pythonScriptPath}`);

    const pythonProcess = spawn(pythonPath, [
      pythonScriptPath,
      start_date,
      end_date,
      forecast_steps.toString()
    ]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      const message = data.toString();
      console.log(message);
      errorString += message;
    });

    pythonProcess.on('close', (code) => {
      console.log(`   Python process exited with code: ${code}`);

      if (res.headersSent) {
        console.log('   ⚠️  Response already sent, skipping...');
        return;
      }

      if (code !== 0) {
        console.error('❌ Python process failed');
        console.error('Error output:', errorString);
        return errorResponse(res, 500, 'Gagal menjalankan prediksi', {
          detail: errorString.split('\n').slice(-10).join('\n')
        });
      }

      try {

        const jsonMatch = dataString.match(/\{[\s\S]*\}/);

        if (!jsonMatch) {
          console.error('❌ No JSON found in output');
          console.error('Raw output:', dataString);

          if (res.headersSent) return;

          return errorResponse(res, 500, 'Format output tidak valid', {
            detail: 'Tidak ditemukan JSON di output Python',
            raw_output: dataString.substring(0, 500)
          });
        }

        const jsonString = jsonMatch[0];
        const result = JSON.parse(jsonString);

        if (!result.success) {
          console.error('❌ Prediction failed:', result.error);

          if (res.headersSent) return;

          return errorResponse(res, 500, 'Prediksi gagal', {
            detail: result.error
          });
        }

        console.log('✅ Prediction completed successfully');

        const historicalData = result.data?.historical_data;
        const predictions = result.data?.predictions;

        if (!historicalData || !predictions) {
          console.error('❌ Missing historical_data or predictions');

          if (res.headersSent) return;

          return errorResponse(res, 500, 'Data tidak lengkap', {
            detail: 'historical_data atau predictions tidak ditemukan',
            received: result.data
          });
        }

        if (!historicalData.dates || !historicalData.values) {
          console.error('❌ Missing dates or values in historical_data');

          if (res.headersSent) return;

          return errorResponse(res, 500, 'Format historical_data tidak valid', {
            detail: 'dates atau values tidak ditemukan'
          });
        }

        const lastDate = new Date(historicalData.dates[historicalData.dates.length - 1]);
        const forecastDates = [];

        for (let i = 1; i <= predictions.length; i++) {
          const newDate = new Date(lastDate);
          newDate.setDate(lastDate.getDate() + (i * 7)); // +7 hari per minggu
          forecastDates.push(newDate.toISOString().split('T')[0]);
        }

        const responseData = {
          history: historicalData.dates.map((date, idx) => ({
            date: date,
            value: Math.round(historicalData.values[idx])
          })),
          forecast: forecastDates.map((date, idx) => ({
            date: date,
            value: Math.round(predictions[idx])
          })),
          historical_data: historicalData,
          predictions: predictions,
          model_info: result.data.model_info,
          summary: result.data.summary
        };

        console.log(`   History points: ${responseData.history.length}`);
        console.log(`   Forecast points: ${responseData.forecast.length}`);

        if (res.headersSent) {
          console.log('   ⚠️  Response already sent');
          return;
        }

        return successResponse(res, 200, 'Prediksi berhasil dijalankan', responseData);

      } catch (parseError) {
        console.error('❌ Failed to parse Python output');
        console.error('Parse error:', parseError.message);
        console.error('Raw output:', dataString.substring(0, 500));

        if (res.headersSent) return;

        return errorResponse(res, 500, 'Gagal memproses hasil prediksi', {
          detail: parseError.message,
          raw_output: dataString.substring(0, 500)
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('❌ Failed to start Python process:', error);

      if (res.headersSent) {
        console.log('   ⚠️  Response already sent, skipping...');
        return;
      }

      return errorResponse(res, 500, 'Gagal memulai proses prediksi', {
        detail: error.code === 'ENOENT'
          ? `Python tidak ditemukan di: ${pythonPath}. Pastikan python3 tersedia di server.`
          : error.message
      });
    });

  } catch (error) {
    console.error('❌ Controller error:', error);
    return errorResponse(res, 500, 'Server error saat menjalankan prediksi', {
      detail: error.message
    });
  }
};