import React from 'react'

const CopyrightFooter = () => {
  return (
    <>
        <footer className='w-full mt-8 sm:mt-16 pb-4'>
            <div className="mx-auto">
                <p className='text-center text-gray-400 text-xs sm:text-sm'>
                    &copy; {new Date().getFullYear()} A-Dynamics Hue. All rights reserved.
                    <br />
                    Powered by <a className='hover:text-main' href="https://adynamics.in" target="_blank" rel="noreferrer">A Dynamics</a>
                </p>
            </div>
        </footer>
    </>
  )
}

export default CopyrightFooter