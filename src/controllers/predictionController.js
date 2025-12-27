const { spawn } = require('child_process');
const path = require('path');
const { successResponse, errorResponse } = require('../utils/response');

/**
 * Jalankan prediksi ARIMA
 * POST /api/predictions/arima
 */
exports.runPrediction = async (req, res) => {
  try {
    const { start_date, end_date, forecast_steps = 4 } = req.body;

    // Validasi input
    if (!start_date || !end_date) {
      return errorResponse(res, 400, 'Parameter start_date dan end_date wajib diisi');
    }

    // Path ke Python script
    const pythonScriptPath = path.join(__dirname, '../../python/predict.py');
    
    // Eksekusi Python script
    const pythonProcess = spawn('python', [
      pythonScriptPath,
      start_date,
      end_date,
      forecast_steps.toString()
    ]);

    let dataString = '';
    let errorString = '';

    // Tangkap output dari Python
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    // Setelah proses selesai
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python error:', errorString);
        return errorResponse(res, 500, 'Gagal menjalankan prediksi', { detail: errorString });
      }

      try {
        const result = JSON.parse(dataString);
        
        if (!result.success) {
          return errorResponse(res, 500, 'Prediksi gagal', { detail: result.error });
        }

        return successResponse(res, 200, 'Prediksi berhasil dijalankan', result.data);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        return errorResponse(res, 500, 'Gagal memproses hasil prediksi');
      }
    });

  } catch (error) {
    console.error('Prediction error:', error);
    return errorResponse(res, 500, 'Server error saat menjalankan prediksi');
  }
};