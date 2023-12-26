CREATE
(p:FAMILYMEMPER{ name:$name, id:$id , sex: $sex, external: $external, birthDate: $birthDate, 
maritalStatus: $maritalStatus, phoneNumber: $phoneNumber, role:$role, deathDate: $deathDate, 
createdBy: $createdBy, updatedBy: $updatedBy })
RETURN p
