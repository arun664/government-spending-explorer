
import React from 'react'

const USReportGenerator = ({ onExportDataChange }) => {
  return (
    <div className="placeholder-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      padding: '2rem',
      textAlign: 'center',
      backgroundColor: '#f8f9fa',
      border: '2px dashed #dee2e6',
      borderRadius: '8px',
      margin: '2rem'
    }}>
      <div style={{
        fontSize: '3rem',
        marginBottom: '1rem',
        color: '#6c757d'
      }}>
        🚧
      </div>
      <h2 style={{
        color: '#495057',
        marginBottom: '1rem',
        fontSize: '1.5rem'
      }}>
        US Spending Analytics
      </h2>
      <p style={{
        color: '#6c757d',
        fontSize: '1.1rem',
        maxWidth: '500px',
        lineHeight: '1.5'
      }}>
        This page is currently under development. 
        <br />
        US-specific spending analysis and insights will be available soon.
      </p>
      <div style={{
        marginTop: '1.5rem',
        padding: '0.75rem 1.5rem',
        backgroundColor: '#e9ecef',
        borderRadius: '4px',
        fontSize: '0.9rem',
        color: '#495057'
      }}>
        Coming Soon: Interactive charts, spending breakdowns, and trend analysis for US government expenditure
      </div>
    </div>
  )
}

export default USReportGenerator