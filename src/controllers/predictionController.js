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

    console.log('🔮 Starting ARIMA prediction...');
    console.log(`   Period: ${start_date} to ${end_date}`);
    console.log(`   Steps: ${forecast_steps}`);

    // Path ke Python script (relatif dari controller)
    const pythonScriptPath = path.join(__dirname, '../../python/predict.py');
    
    // Path ke Python di virtual environment
    // PENTING: Sesuaikan dengan OS kamu
    const isWindows = process.platform === 'win32';
    const pythonPath = isWindows
      ? path.join(__dirname, '../../python/venv/Scripts/python.exe')
      : path.join(__dirname, '../../python/venv/bin/python');

    console.log(`   Python path: ${pythonPath}`);
    console.log(`   Script path: ${pythonScriptPath}`);

    // Eksekusi Python script
    const pythonProcess = spawn(pythonPath, [
      pythonScriptPath,
      start_date,
      end_date,
      forecast_steps.toString()
    ]);

    let dataString = '';
    let errorString = '';

    // Tangkap stdout (JSON result)
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    // Tangkap stderr (log messages)
    pythonProcess.stderr.on('data', (data) => {
      const message = data.toString();
      console.log(message); // Forward log ke console Node.js
      errorString += message;
    });

    // Setelah proses selesai
    pythonProcess.on('close', (code) => {
      console.log(`   Python process exited with code: ${code}`);

      if (code !== 0) {
        console.error('❌ Python process failed');
        console.error('Error output:', errorString);
        return errorResponse(res, 500, 'Gagal menjalankan prediksi', { 
          detail: errorString.split('\n').slice(-10).join('\n') // Last 10 lines
        });
      }

      try {
        // Parse JSON dari Python
        const result = JSON.parse(dataString);
        
        if (!result.success) {
          console.error('❌ Prediction failed:', result.error);
          return errorResponse(res, 500, 'Prediksi gagal', { 
            detail: result.error 
          });
        }

        console.log('✅ Prediction completed successfully');
        console.log(`   Predictions: ${result.data.predictions}`);

        return successResponse(res, 200, 'Prediksi berhasil dijalankan', result.data);

      } catch (parseError) {
        console.error('❌ Failed to parse Python output');
        console.error('Parse error:', parseError.message);
        console.error('Raw output:', dataString.substring(0, 500)); // First 500 chars
        return errorResponse(res, 500, 'Gagal memproses hasil prediksi', {
          detail: parseError.message
        });
      }
    });

    // Handle error saat spawn
    pythonProcess.on('error', (error) => {
      console.error('❌ Failed to start Python process:', error);
      return errorResponse(res, 500, 'Gagal memulai proses prediksi', {
        detail: `Python executable not found at: ${pythonPath}. Make sure virtual environment is created.`
      });
    });

  } catch (error) {
    console.error('❌ Controller error:', error);
    return errorResponse(res, 500, 'Server error saat menjalankan prediksi');
  }
};