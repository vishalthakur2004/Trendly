import React, { useState, useRef, useEffect } from 'react'
import { Camera, Video, X, RotateCcw, Circle, Square } from 'lucide-react'
import webrtcService from '../services/webrtcService'

const CameraCapture = ({ isOpen, onClose, onCapture, captureType = 'photo' }) => {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const [stream, setStream] = useState(null)
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [isCameraReady, setIsCameraReady] = useState(false)
    const [error, setError] = useState('')
    const [facingMode, setFacingMode] = useState('user') // 'user' for front camera, 'environment' for back camera
    const recordingTimeRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            startCamera()
        } else {
            stopCamera()
        }

        return () => {
            stopCamera()
        }
    }, [isOpen, facingMode])

    useEffect(() => {
        if (isRecording) {
            recordingTimeRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } else {
            if (recordingTimeRef.current) {
                clearInterval(recordingTimeRef.current)
                recordingTimeRef.current = null
            }
            setRecordingTime(0)
        }

        return () => {
            if (recordingTimeRef.current) {
                clearInterval(recordingTimeRef.current)
            }
        }
    }, [isRecording])

    const startCamera = async () => {
        try {
            setError('')
            setIsCameraReady(false)

            const constraints = {
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1080 },
                    height: { ideal: 1920 },
                    frameRate: { ideal: 30 }
                },
                audio: captureType === 'video'
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
            setStream(mediaStream)

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream
                videoRef.current.onloadedmetadata = () => {
                    setIsCameraReady(true)
                }
            }
        } catch (err) {
            console.error('Error accessing camera:', err)
            setError('Unable to access camera. Please check your permissions.')
        }
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
        setIsCameraReady(false)
        setIsRecording(false)
        setRecordingTime(0)
    }

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to blob
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
                onCapture(file)
                onClose()
            }
        }, 'image/jpeg', 0.9)
    }

    const startVideoRecording = () => {
        if (!stream) return

        try {
            const options = {
                mimeType: 'video/webm;codecs=vp9',
                videoBitsPerSecond: 2500000
            }

            // Fallback for browsers that don't support vp9
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options.mimeType = 'video/webm'
            }

            const mediaRecorder = new MediaRecorder(stream, options)
            const chunks = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' })
                const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' })
                onCapture(file)
                onClose()
            }

            mediaRecorderRef.current = mediaRecorder
            mediaRecorder.start()
            setIsRecording(true)
        } catch (err) {
            console.error('Error starting video recording:', err)
            setError('Unable to start video recording.')
        }
    }

    const stopVideoRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
        }
    }

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 bg-black z-50 flex flex-col'>
            {/* Header */}
            <div className='flex items-center justify-between p-4 text-white'>
                <button
                    onClick={onClose}
                    className='w-10 h-10 rounded-full bg-black bg-opacity-30 flex items-center justify-center hover:bg-opacity-50 transition-all'
                >
                    <X className="w-6 h-6" />
                </button>
                
                <div className='text-center'>
                    <h2 className='text-lg font-semibold'>
                        {captureType === 'photo' ? 'Take Photo' : 'Record Video'}
                    </h2>
                    {isRecording && (
                        <div className='text-red-400 font-mono'>
                            {formatTime(recordingTime)}
                        </div>
                    )}
                </div>

                <button
                    onClick={toggleCamera}
                    className='w-10 h-10 rounded-full bg-black bg-opacity-30 flex items-center justify-center hover:bg-opacity-50 transition-all'
                    disabled={!isCameraReady}
                >
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>

            {/* Camera View */}
            <div className='flex-1 relative overflow-hidden'>
                {error ? (
                    <div className='flex items-center justify-center h-full text-white text-center p-4'>
                        <div>
                            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className='text-lg mb-2'>Camera Error</p>
                            <p className='text-sm opacity-75'>{error}</p>
                            <button
                                onClick={startCamera}
                                className='mt-4 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all'
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className='w-full h-full object-cover'
                            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                        />
                        {!isCameraReady && (
                            <div className='absolute inset-0 flex items-center justify-center bg-black'>
                                <div className='text-white text-center'>
                                    <Camera className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                                    <p>Starting camera...</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Controls */}
            {isCameraReady && !error && (
                <div className='p-6 flex items-center justify-center'>
                    {captureType === 'photo' ? (
                        <button
                            onClick={capturePhoto}
                            className='w-20 h-20 rounded-full bg-white border-4 border-gray-300 hover:border-gray-400 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center'
                        >
                            <Circle className="w-16 h-16 text-gray-600" />
                        </button>
                    ) : (
                        <button
                            onClick={isRecording ? stopVideoRecording : startVideoRecording}
                            className={`w-20 h-20 rounded-full border-4 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center ${
                                isRecording 
                                    ? 'bg-red-500 border-red-400 hover:border-red-300' 
                                    : 'bg-white border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            {isRecording ? (
                                <Square className="w-8 h-8 text-white" />
                            ) : (
                                <Circle className="w-16 h-16 text-gray-600" />
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className='hidden' />
        </div>
    )
}

export default CameraCapture
