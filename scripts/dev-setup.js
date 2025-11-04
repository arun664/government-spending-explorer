#!/usr/bin/env node

/**
 * Development setup script for Government Expense Dashboard
 * This script helps with initial development setup and data validation
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

console.log('🚀 Government Expense Dashboard - Development Setup')
console.log('=' .repeat(50))

// Check if required directories exist
const requiredDirs = [
  'src/components',
  'src/services', 
  'src/utils',
  'data'
]

console.log('\n📁 Checking directory structure...')
requiredDirs.forEach(dir => {
  const fullPath = path.join(projectRoot, dir)
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${dir}`)
  } else {
    console.log(`❌ ${dir} - Missing!`)
  }
})

// Check if data files exist
console.log('\n📊 Checking data files...')
const dataDir = path.join(projectRoot, 'data')
if (fs.existsSync(dataDir)) {
  const dataFiles = fs.readdirSync(dataDir)
  dataFiles.forEach(file => {
    if (file.endsWith('.csv')) {
      const filePath = path.join(dataDir, file)
      const stats = fs.statSync(filePath)
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
      console.log(`✅ ${file} (${sizeInMB} MB)`)
    }
  })
} else {
  console.log('❌ Data directory not found!')
}

// Check package.json dependencies
console.log('\n📦 Checking dependencies...')
const packageJsonPath = path.join(projectRoot, 'package.json')
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const requiredDeps = ['react', 'react-dom', 'd3', 'topojson-client']
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      console.log(`✅ ${dep} - ${packageJson.dependencies[dep]}`)
    } else {
      console.log(`❌ ${dep} - Missing!`)
    }
  })
} else {
  console.log('❌ package.json not found!')
}

console.log('\n🎯 Next Steps:')
console.log('1. Run "npm install" to install dependencies')
console.log('2. Run "npm run dev" to start development server')
console.log('3. Open http://localhost:5173 in your browser')
console.log('4. Begin implementing dashboard components')

console.log('\n✨ Setup check complete!')