/**
 * ComparisonPage - GDP vs Expense Growth Comparison
 * 
 * Features:
 * - Multi-chart dashboard with optimized data loading
 * - Unit normalization (GDP in millions USD, Spending in millions USD)
 * - Interactive charts with synchronized hover
 * - Year range filtering for performance
 * 
 * Requirements: Comprehensive comparison view for GDP vs Expense analysis
 */

import ComparisonDashboard from './ComparisonDashboard.jsx'
import '../styles/ComparisonPage.css'

// Main component
function ComparisonContent({ onLoadingChange }) {
  return (
    <div className="comparison-page-dashboard">
      <ComparisonDashboard onLoadingChange={onLoadingChange} />
    </div>
  )
}

const ComparisonPage = ({ onLoadingChange, onControlsReady }) => {
  return <ComparisonContent onLoadingChange={onLoadingChange} onControlsReady={onControlsReady} />
}

export default ComparisonPage
