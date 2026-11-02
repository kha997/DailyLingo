import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary
    fallbackTitle="DailyLingo gặp lỗi không mong muốn"
    fallbackMessage="Dữ liệu đã lưu trên thiết bị này vẫn còn. Hãy thử lại, hoặc tải lại trang. Bạn có thể xuất bản sao lưu sau khi ứng dụng mở lại."
  >
    <App />
  </ErrorBoundary>
);
