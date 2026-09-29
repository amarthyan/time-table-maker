def apply_hard_constraints(solver):
    model = solver.model
    time_slots = [t for t in solver.time_slots if not t.is_break]
    assignments = solver.assignments
    rooms = solver.rooms
    labs = solver.labs
    X = solver.X
    Y = solver.Y
    Z = solver.Z
    
    # 1. Weekly hours must be satisfied
    for a in assignments:
        model.Add(sum(X[(a.id, t.id)] for t in time_slots) == a.weekly_periods)
        
        # Link X with Y or Z
        for t in time_slots:
            if not a.is_lab:
                model.Add(X[(a.id, t.id)] == sum(Y[(a.id, t.id, r.id)] for r in rooms))
            else:
                model.Add(X[(a.id, t.id)] == sum(Z[(a.id, t.id, l.id)] for l in labs))

    # 2. Class conflict: A class cannot have two subjects at the same time
    class_assignments = {}
    for a in assignments:
        class_assignments.setdefault(a.class_id, []).append(a)
    
    for t in time_slots:
        for class_id, asgns in class_assignments.items():
            model.AddAtMostOne(X[(a.id, t.id)] for a in asgns)

    # 3. Teacher conflict: A teacher cannot teach two classes simultaneously
    teacher_vars = {}
    for t in time_slots:
        for a in assignments:
            teachers = [a.teacher_id] + a.assistant_ids
            for tr in teachers:
                if tr not in teacher_vars:
                    teacher_vars[tr] = {}
                if t.id not in teacher_vars[tr]:
                    teacher_vars[tr][t.id] = []
                teacher_vars[tr][t.id].append(X[(a.id, t.id)])
                
    for tr, time_vars in teacher_vars.items():
        for t_id, vars_list in time_vars.items():
            model.AddAtMostOne(vars_list)

    # 4. Room conflict: A room cannot host two classes simultaneously
    for t in time_slots:
        for r in rooms:
            model.AddAtMostOne(Y[(a.id, t.id, r.id)] for a in assignments if not a.is_lab)

    # 5. Lab conflict: A lab cannot host two sessions simultaneously
    for t in time_slots:
        for l in labs:
            model.AddAtMostOne(Z[(a.id, t.id, l.id)] for a in assignments if a.is_lab)

    # 6. Lab sessions occupy 2 consecutive periods
    # Group time slots by day
    days = {}
    for t in time_slots:
        days.setdefault(t.day, []).append(t)
        
    for day_slots in days.values():
        day_slots.sort(key=lambda x: x.period)
        
    for a in assignments:
        if a.is_lab:
            for day, slots in days.items():
                for i, t in enumerate(slots):
                    # A lab cannot start on the last period of the day or before a break if consecutive
                    if i == len(slots) - 1 or slots[i+1].period != t.period + 1:
                        # Cannot start a lab block here
                        # Actually OR-tools doesn't easily let us say "if X=1 then next X=1".
                        # A better way: define a starting variable for 2-hour blocks.
                        pass
                        
    # Better implementation for 2-hour labs:
    # We create a new boolean variable for "Lab starts at t"
    # lab_start[(a, t)]
    lab_starts = {}
    for a in assignments:
        if a.is_lab:
            for day, slots in days.items():
                for i, t in enumerate(slots):
                    lab_starts[(a.id, t.id)] = model.NewBoolVar(f"lab_start_a{a.id}_t{t.id}")
                    
            # A lab is running at t if it started at t or t-1
            for day, slots in days.items():
                for i, t in enumerate(slots):
                    prev_start = lab_starts[(a.id, slots[i-1].id)] if i > 0 and slots[i-1].period == t.period - 1 else 0
                    curr_start = lab_starts[(a.id, t.id)]
                    model.Add(X[(a.id, t.id)] == (prev_start + curr_start))
                    
                    # Cannot start at the last slot if no next slot or next slot is not contiguous
                    if i == len(slots) - 1 or slots[i+1].period != t.period + 1:
                        model.Add(curr_start == 0)
                        
            # Same lab room must be used for both slots
            for l in labs:
                for day, slots in days.items():
                    for i in range(len(slots) - 1):
                        if slots[i+1].period == slots[i].period + 1:
                            t1 = slots[i].id
                            t2 = slots[i+1].id
                            # If lab starts at t1, Z at t1 and t2 must be equal to 1 for some l
                            start_var = lab_starts[(a.id, t1)]
                            model.Add(Z[(a.id, t1, l.id)] == Z[(a.id, t2, l.id)]).OnlyEnforceIf(start_var)
