import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import EnhancedLanguageSelector from '../components/EnhancedLanguageSelector';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercentage,
  getRelativeTime,
  getMonths,
  formatSize,
  formatAcYear,
  getApplicationStatus,
  getUserRole,
  validateEmail,
  validateRequired,
  getCurrentLanguage,
  isCurrentLanguageRTL,
  tn
} from '../i18n/enhanced-utils';

const I18nExampleComponent = () => {
  const { t, i18n } = useTranslation(['common', 'students']);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Example data
  const exampleData = {
    tuitionFee: 25000,
    applicationDeadline: new Date('2024-12-15'),
    lastLogin: new Date(Date.now() - 86400000 * 2), // 2 days ago
    gpa: 3.85,
    fileSize: 2048576, // 2MB
    academicYear: 2024,
    completionRate: 0.75,
    applicationStatus: 'under_review',
    userRole: 'student'
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    const error = validateEmail(value);
    setEmailError(error || '');
  };

  const currentLang = getCurrentLanguage();
  const isRTL = isCurrentLanguageRTL();

  return (
    <div className={`i18n-example ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="header">
        <h1>{t('common:navigation.home')}</h1>
        <EnhancedLanguageSelector />
      </div>

      <div className="content">
        <section className="basic-translations">
          <h2>{t('common:examples.basicTranslations', 'Basic Translations')}</h2>
          <div className="example-grid">
            <div className="example-item">
              <strong>{t('common:buttons.save')}:</strong>
              <span>{t('common:buttons.save')}</span>
            </div>
            <div className="example-item">
              <strong>{tn('title', 'students')}:</strong>
              <span>{tn('title', 'students')}</span>
            </div>
            <div className="example-item">
              <strong>{t('common:status.active')}:</strong>
              <span>{t('common:status.active')}</span>
            </div>
          </div>
        </section>

        <section className="interpolation-examples">
          <h2>{t('common:examples.interpolation', 'Interpolation Examples')}</h2>
          <div className="example-grid">
            <div className="example-item">
              <strong>{t('common:examples.welcome', 'Welcome Message')}:</strong>
              <span>{tn('dashboard.welcome', 'students', { name: 'John Doe' })}</span>
            </div>
            <div className="example-item">
              <strong>{t('common:examples.childProgress', 'Child Progress')}:</strong>
              <span>{tn('dashboard.childProgress', 'parents', { childName: 'Sarah' })}</span>
            </div>
          </div>
        </section>

        <section className="formatting-examples">
          <h2>{t('common:examples.formatting', 'Regional Formatting')}</h2>
          <div className="formatting-grid">
            <div className="format-section">
              <h3>{t('common:examples.currency', 'Currency')}</h3>
              <div className="format-examples">
                <div>
                  <strong>{t('common:examples.tuitionFee', 'Tuition Fee')}:</strong>
                  <span>{formatCurrency(exampleData.tuitionFee)}</span>
                </div>
                <div>
                  <strong>{t('common:examples.applicationFee', 'Application Fee')}:</strong>
                  <span>{formatCurrency(150, 'USD')}</span>
                </div>
              </div>
            </div>

            <div className="format-section">
              <h3>{t('common:examples.dates', 'Dates & Times')}</h3>
              <div className="format-examples">
                <div>
                  <strong>{t('common:examples.deadline', 'Deadline')}:</strong>
                  <span>{formatDate(exampleData.applicationDeadline)}</span>
                </div>
                <div>
                  <strong>{t('common:examples.lastLogin', 'Last Login')}:</strong>
                  <span>{getRelativeTime(exampleData.lastLogin)}</span>
                </div>
                <div>
                  <strong>{t('common:examples.meetingTime', 'Meeting Time')}:</strong>
                  <span>{formatDateTime(exampleData.applicationDeadline, { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                </div>
              </div>
            </div>

            <div className="format-section">
              <h3>{t('common:examples.numbers', 'Numbers & Statistics')}</h3>
              <div className="format-examples">
                <div>
                  <strong>{t('common:examples.gpa', 'GPA')}:</strong>
                  <span>{formatNumber(exampleData.gpa, { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2 
                  })}</span>
                </div>
                <div>
                  <strong>{t('common:examples.completionRate', 'Completion Rate')}:</strong>
                  <span>{formatPercentage(exampleData.completionRate)}</span>
                </div>
                <div>
                  <strong>{t('common:examples.fileSize', 'File Size')}:</strong>
                  <span>{formatSize(exampleData.fileSize)}</span>
                </div>
                <div>
                  <strong>{t('common:examples.academicYear', 'Academic Year')}:</strong>
                  <span>{formatAcYear(exampleData.academicYear)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="status-examples">
          <h2>{t('common:examples.statusFormatting', 'Status Formatting')}</h2>
          <div className="status-grid">
            <div className="status-item">
              <strong>{t('common:examples.applicationStatus', 'Application Status')}:</strong>
              {(() => {
                const status = getApplicationStatus(exampleData.applicationStatus);
                return (
                  <span className="status-badge" style={{ color: status.color }}>
                    {status.icon} {status.text}
                  </span>
                );
              })()}
            </div>
            <div className="status-item">
              <strong>{t('common:examples.userRole', 'User Role')}:</strong>
              <span>{getUserRole(exampleData.userRole)}</span>
            </div>
          </div>
        </section>

        <section className="validation-examples">
          <h2>{t('common:examples.validation', 'Form Validation')}</h2>
          <div className="form-example">
            <div className="form-group">
              <label htmlFor="email">
                {t('common:forms.emailAddress')}
                <span className="required">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder={t('common:forms.emailAddress')}
                className={emailError ? 'error' : ''}
              />
              {emailError && (
                <span className="error-message">{emailError}</span>
              )}
            </div>
            <div className="validation-info">
              <p><strong>{t('common:examples.validationRules', 'Validation Rules')}:</strong></p>
              <ul>
                <li>{validateRequired('') || t('common:examples.noError', 'No error when filled')}</li>
                <li>{validateEmail('invalid-email') || t('common:examples.validEmail', 'Valid email format')}</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="localized-lists">
          <h2>{t('common:examples.localizedLists', 'Localized Lists')}</h2>
          <div className="lists-grid">
            <div className="list-section">
              <h3>{t('common:examples.months', 'Months')}</h3>
              <div className="month-list">
                {getMonths('short').map((month, index) => (
                  <span key={index} className="month-item">{month}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rtl-demonstration">
          <h2>{t('common:examples.rtlSupport', 'RTL Support')}</h2>
          <div className="rtl-info">
            <p>
              <strong>{t('common:examples.currentLanguage', 'Current Language')}:</strong> 
              {currentLang.toUpperCase()}
            </p>
            <p>
              <strong>{t('common:examples.textDirection', 'Text Direction')}:</strong> 
              {isRTL ? t('common:examples.rightToLeft', 'Right-to-Left') : t('common:examples.leftToRight', 'Left-to-Right')}
            </p>
            <div className="rtl-text-example" dir="auto">
              <p>{t('common:examples.rtlText', 'This text adapts to the language direction')}</p>
              <p className="mixed-direction">
                English text مع النص العربي and back to English
              </p>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .i18n-example {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .rtl {
          direction: rtl;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .content {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        section {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        h2 {
          margin: 0 0 20px 0;
          color: #1f2937;
          font-size: 24px;
          font-weight: 600;
        }

        h3 {
          margin: 0 0 16px 0;
          color: #374151;
          font-size: 18px;
          font-weight: 500;
        }

        .example-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .example-item {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .formatting-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 24px;
        }

        .format-section {
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .format-examples {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .format-examples > div {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .status-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .status-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          background: rgba(59, 130, 246, 0.1);
          font-weight: 500;
        }

        .form-example {
          max-width: 400px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
        }

        .required {
          color: #ef4444;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 16px;
        }

        .form-group input.error {
          border-color: #ef4444;
        }

        .error-message {
          display: block;
          margin-top: 4px;
          color: #ef4444;
          font-size: 14px;
        }

        .validation-info {
          padding: 16px;
          background: #f0f9ff;
          border-radius: 6px;
          border: 1px solid #bae6fd;
        }

        .validation-info ul {
          margin: 8px 0 0 0;
          padding-left: 20px;
        }

        .validation-info li {
          margin: 4px 0;
          color: #1e40af;
        }

        .lists-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .list-section {
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .month-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .month-item {
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .rtl-info {
          background: #fef3c7;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #f59e0b;
        }

        .rtl-text-example {
          margin-top: 16px;
          padding: 16px;
          background: white;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }

        .mixed-direction {
          font-style: italic;
          color: #6b7280;
        }

        /* RTL-specific styles */
        .rtl .example-item {
          flex-direction: row-reverse;
        }

        .rtl .format-examples > div {
          flex-direction: row-reverse;
        }

        .rtl .status-item {
          flex-direction: row-reverse;
        }

        .rtl .validation-info ul {
          padding-right: 20px;
          padding-left: 0;
        }
      `}</style>
    </div>
  );
};

export default I18nExampleComponent;