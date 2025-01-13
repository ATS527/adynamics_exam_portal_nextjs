'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Eye, SquareCheckBig } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"

interface ExamResult {
  id: string
  exam: {
    id: string
    title: string
  }
  user_id: string
  user_name: string | null
  start_time: string
  end_time: string
  time_taken: number
  total_questions: number
  score: number
  correct_answers: number
  wrong_answers: number
  skipped_questions: number
}

interface AttemptDetail {
  question: string
  selected_option: string | null
  correct_option: string
  status: 'correct' | 'wrong' | 'skipped'
  isDynamic: boolean
  dynamicInfo: {
    template: string
    variableRanges: string
    rules: string
  } | null
  questionType: string
}

// Helper function to format date
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}

export default function ResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  const [selectedAttempt, setSelectedAttempt] = useState<ExamResult | null>(null)
  const [attemptDetails, setAttemptDetails] = useState<AttemptDetail[]>([])
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const columns: ColumnDef<ExamResult>[] = [
    {
      accessorKey: "user_name",
      header: "User",
      cell: ({ row }) => <div>{row.getValue("user_name")}</div>,
    },
    {
      accessorKey: "exam.title",
      header: "Exam",
    },
    {
      accessorKey: "score",
      header: "Score",
      cell: ({ row }) => <div>{row.getValue("score")}%</div>,
    },
    {
      accessorKey: "correct_answers",
      header: "Correct",
    },
    {
      accessorKey: "wrong_answers",
      header: "Wrong",
    },
    {
      accessorKey: "skipped_questions",
      header: "Skipped",
    },
    {
      accessorKey: "time_taken",
      header: "Time Taken",
      cell: ({ row }) => {
        const minutes = Math.floor(row.getValue("time_taken") / 60)
        const seconds = (row.getValue("time_taken") % 60).toString().padStart(2, "0")
        return <div>{minutes}:{seconds}</div>
      },
    },
    {
      accessorKey: "end_time",
      header: "Completed",
      cell: ({ row }) => <div>{formatDate(row.getValue("end_time"))}</div>,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleViewDetails(row.original)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">View</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
  ]

  const table = useReactTable({
    data: results,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    async function fetchResults() {
      if (!session) return

      try {
        // First get all exam attempts
        const { data: examAttempts, error: attemptsError } = await supabase
          .from('user_exam_attempts')
          .select(`
            id,
            exam:exams (
              id,
              title
            ),
            user_id,
            start_time,
            end_time,
            time_taken,
            total_questions,
            score,
            correct_answers,
            wrong_answers,
            skipped_questions
          `)
          .order('end_time', { ascending: false })

        if (attemptsError) throw attemptsError

        // Then get user details for each attempt
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name')

        if (usersError) throw usersError

        // Map users to attempts
        const userMap = new Map(users.map((user: any) => [user.id, user.name]))
        
        const resultsWithNames = examAttempts.map(attempt => ({
          ...attempt,
          user_name: userMap.get(attempt.user_id) || 'Unknown User'
        }))

        setResults(resultsWithNames as unknown as ExamResult[])
        } catch (err: any) {
        console.error('Error fetching results:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [session])

  const handleViewDetails = async (attempt: ExamResult) => {
    setSelectedAttempt(attempt)
    setDetailsLoading(true)

    try {
      // Fetch responses for this attempt
      const { data: responses, error: responsesError } = await supabase
        .from('user_question_responses')
        .select(`
          id,
          question_id,
          user_response,
          correct_answer,
          is_correct,
          questions!inner (
            id,
            question_text,
            question_type,
            template,
            variable_ranges,
            option_generation_rules,
            metadata
          )
        `)
        .eq('user_exam_attempt_id', attempt.id)

      if (responsesError) throw responsesError

      const details: AttemptDetail[] = responses?.map((response: any) => {
        const question = response.questions;
        let questionText = '';
        let dynamicInfo = null;

        switch (question.question_type) {
          case 'static':
            questionText = question.question_text;
            break;
          
          case 'dynamic':
          case 'dynamic conditional':
          case 'dynamic text conditional':
            const metadata = response.metadata || {};
            questionText = metadata.generated_question || question.template || question.question_text;
            
            const variableRanges = question.variable_ranges || {};
            let variableValues = '';
            
            if (question.question_type === 'dynamic') {
              variableValues = Object.entries(variableRanges)
                .map(([name, range]: [string, any]) => (
                  `${name}: ${range.min}-${range.max}`
                ))
                .join(', ');
            } else if (question.question_type === 'dynamic conditional') {
              const enumValues = variableRanges.enum_values || {};
              const rangeValues = variableRanges.range_values || {};
              
              variableValues = [
                ...Object.entries(enumValues).map(([name, values]: [string, any]) => 
                  `${name}: [${values.join(', ')}]`
                ),
                ...Object.entries(rangeValues).map(([name, range]: [string, any]) => 
                  `${name}: ${range.min}-${range.max}`
                )
              ].join(', ');
            } else {
              const enumValues = variableRanges.enum_values || {};
              variableValues = Object.entries(enumValues)
                .map(([name, values]: [string, any]) => 
                  `${name}: [${values.join(', ')}]`
                )
                .join(', ');
            }
            
            dynamicInfo = {
              template: question.template || '',
              variableRanges: variableValues,
              rules: question.option_generation_rules ? 
                JSON.stringify(question.option_generation_rules, null, 2) : ''
            };
            break;
        }

        return {
          question: questionText,
          selected_option: response.user_response,
          correct_option: response.correct_answer,
          status: response.is_correct ? 'correct' : 
            response.user_response ? 'wrong' : 'skipped',
          isDynamic: question.question_type !== 'static',
          dynamicInfo,
          questionType: question.question_type
        };
      }) || [];
      
      setAttemptDetails(details)
    } catch (err: any) {
      console.error('Error fetching attempt details:', err)
    } finally {
      setDetailsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div>
        <h2 className="text-2xl font-bold flex items-center mt-3 mb-1">
          <SquareCheckBig className="mr-2" /> Exam Results
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          View all exam attempts and results
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 py-4">
        <Input
          placeholder="Filter by user..."
          value={
            (table.getColumn("user_name")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("user_name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default">Columns</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead className="text-center" key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className="text-center" key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-primary">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </div>
        <div className="space-x-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog
        open={!!selectedAttempt}
        onOpenChange={() => setSelectedAttempt(null)}
      >
        <DialogContent className="max-h-[90vh] w-11/12 rounded-xl overflow-y-auto overflow-x-hidden sm:max-w-xl md:max-w-2xl lg:max-w-4xl scrollbar-hide">
          <DialogHeader>
            <DialogTitle className="text-start">Attempt Details</DialogTitle>
            <DialogDescription className="break-words text-start">
              {selectedAttempt?.user_name}&apos;s attempt of{" "}
              {selectedAttempt?.exam.title}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4 w-full">
              {attemptDetails.map((detail, index) => (
                <div key={index} className="p-4 rounded-lg border">
                  <div className="space-y-2 break-words">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <Badge
                        variant={
                          detail.status === "correct"
                            ? "default"
                            : detail.status === "wrong"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          detail.status === "correct"
                            ? "bg-green-500"
                            : undefined
                        }
                      >
                        {detail.status.charAt(0).toUpperCase() +
                          detail.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {detail.question}
                    </p>
                    {detail.isDynamic && detail.dynamicInfo && (
                      <div className="mt-2 space-y-1 text-sm bg-gray-50 p-3 rounded-md">
                        <p className="font-medium text-gray-600">
                          Dynamic Question Details ({detail.questionType}):
                        </p>
                        <p className="text-gray-600 break-words">
                          <span className="font-medium">Template:</span>{" "}
                          <code className="bg-gray-100 px-1 py-0.5 rounded break-all">
                            {detail.dynamicInfo.template}
                          </code>
                        </p>
                        {detail.dynamicInfo.variableRanges && (
                          <p className="text-gray-600 break-words">
                            <span className="font-medium">
                              Variable Ranges:
                            </span>{" "}
                            <code className="bg-gray-100 px-1 py-0.5 rounded break-all">
                              {detail.dynamicInfo.variableRanges}
                            </code>
                          </p>
                        )}
                        {detail.dynamicInfo.rules && (
                          <p className="text-gray-600">
                            <span className="font-medium">
                              Generation Rules:
                            </span>{" "}
                            <pre className="bg-gray-100 px-2 py-1 rounded whitespace-pre-wrap break-words text-xs">
                              {detail.dynamicInfo.rules}
                            </pre>
                          </p>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Selected Answer
                        </p>
                        <p className="mt-1 break-words">
                          {detail.selected_option || "Not answered"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">
                          Correct Answer
                        </p>
                        <p className="mt-1 break-words">
                          {detail.correct_option}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
