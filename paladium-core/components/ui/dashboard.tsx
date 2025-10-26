import { CheckCircle2, Clock, BarChart3, Target } from "lucide-react"
import { AnnotatorStats } from "@/types/stats"

export const AnnotatorDashboard = ({ stats, loading }: { stats: AnnotatorStats | null, loading: boolean }) => {

    if (!stats) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-24 bg-gray-200 rounded"></div>
                        <div className="h-24 bg-gray-200 rounded"></div>
                        <div className="h-24 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!stats && !loading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-6 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-600">Something went wrong</p>
            </div>
        );
    }


    const progressPercentage = stats ? stats.progress_percentage || 0 : 0;
    const isComplete = progressPercentage === 100;

    return (
        <div className="w-full max-w-4xl mx-auto p-6  rounded-xl shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 border-black border-2 rounded-lg">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Your Progress</h2>
                        <p className="text-sm text-gray-600">Track your annotation journey</p>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 bg-white rounded-xl p-6 shadow-md">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-semibold text-gray-700">Overall Progress</span>
                    <span className="text-3xl font-bold ">
                        {progressPercentage.toFixed(1)}%
                    </span>
                </div>

                <div className="relative w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ease-out ${isComplete
                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                            }`}
                        style={{ width: `${progressPercentage}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                </div>

                <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>{stats.classified_images} classified</span>
                    <span>{stats.remaining_images} remaining</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Images */}
                <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Images</p>
                            <p className="text-3xl font-bold text-gray-800">{stats.total_images}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Target className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Classified */}
                <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Classified</p>
                            <p className="text-3xl font-bold text-green-600">{stats.classified_images}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* Remaining */}
                <div className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Remaining</p>
                            <p className="text-3xl font-bold text-orange-600">{stats.remaining_images}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
};
