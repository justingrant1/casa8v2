"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Application } from "@/lib/applications"

interface ApplicationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  application: Application | null
}

export function ApplicationDetailsModal({ isOpen, onClose, application }: ApplicationDetailsModalProps) {
  if (!application) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Application Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Property Information</h3>
            <p><strong>Property:</strong> {application.properties?.title}</p>
            <p><strong>Address:</strong> {application.properties?.address}</p>
            <p><strong>Rent:</strong> ${application.properties?.price}/month</p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Applicant Information</h3>
            <p><strong>Name:</strong> {application.tenant_name}</p>
            <p><strong>Email:</strong> {application.tenant_email}</p>
            <p><strong>Phone:</strong> {application.tenant_phone}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Application Data</h3>
            <p><strong>Status:</strong> <Badge>{application.status}</Badge></p>
            <p><strong>Move-in Date:</strong> {application.move_in_date ? new Date(application.move_in_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Lease Length:</strong> {application.lease_length_months} months</p>
            <p><strong>Monthly Income:</strong> ${application.monthly_income}</p>
            <p><strong>Employment Status:</strong> {application.employment_status}</p>
            <p><strong>Employer:</strong> {application.employer_name}</p>
            <p><strong>Section 8 Voucher:</strong> {application.has_voucher ? 'Yes' : 'No'}</p>
            {application.has_voucher && (
              <>
                <p><strong>Voucher Bedrooms:</strong> {application.voucher_bedrooms}</p>
                <p><strong>Voucher City:</strong> {application.voucher_city}</p>
                <p><strong>Voucher Amount:</strong> ${application.voucher_amount}</p>
              </>
            )}
          </div>

          {application.message && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Message from Applicant</h3>
              <p>{application.message}</p>
            </div>
          )}

          {application.previous_rental_history && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Previous Rental History</h3>
              <p>{application.previous_rental_history}</p>
            </div>
          )}

          {application.ref_text && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2">References</h3>
              <p>{application.ref_text}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
